import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './contact.entity';
import { DataSource, Like, Repository } from 'typeorm';
import { ContactDTO, ContactInviteDTO } from './contact.dto';
import { decodeCursor, encodeCursor } from 'src/infrastructure/util/cursor';
import { ContactInvite } from './contact-invite.entity';
import { User } from '../user/user.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(ContactInvite)
    private readonly contactInviteRepository: Repository<ContactInvite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async createContacts(userId: string, body: ContactDTO) {
    if (!body.contacts || body.contacts.length === 0) {
      const contacts = (
        await this.userRepository
          .createQueryBuilder('user')
          .where({
            nickname: Like('TEST_%'),
          })
          .limit(30)
          .getMany()
      ).map((user) => {
        const contact = new Contact();
        contact.userId = userId;
        contact.phoneNumber = user.phoneNumber;
        contact.displayName = user.nickname;
        return contact;
      });

      await this.contactRepository
        .createQueryBuilder()
        .insert()
        .into(Contact)
        .values(contacts)
        .orUpdate(
          ['userId', 'phoneNumber', 'displayName'],
          ['userId', 'phoneNumber'],
        )
        .execute();

      return {
        message: 'Contacts created successfully',
        contactCount: contacts.length,
      };
    }

    const groupedContacts = body.contacts.reduce((acc, contact) => {
      if (
        !contact.displayName ||
        contact.displayName === '' ||
        contact.displayName === ' '
      ) {
        contact.displayName = null;
      }
      if (acc[contact.phoneNumber]) {
        // If the contact with this phone number already exists, concatenate the display name
        acc[contact.phoneNumber].displayName += '/' + contact.displayName;
      } else {
        // Otherwise, add the contact to the accumulator
        acc[contact.phoneNumber] = contact;
      }

      return acc;
    }, {});

    // Convert the result back into an array
    const result = Object.values(groupedContacts);

    const contacts = result.map((contactInfo) => {
      const contact = new Contact();
      contact.userId = userId;
      contact.phoneNumber = contactInfo['phoneNumber'];
      contact.displayName = contactInfo['displayName'];
      return contact;
    });

    const testContacts = (
      await this.userRepository
        .createQueryBuilder('user')
        .where({
          nickname: Like('TEST_%'),
        })
        .limit(30)
        .getMany()
    ).map((user) => {
      const contact = new Contact();
      contact.userId = userId;
      contact.phoneNumber = user.phoneNumber;
      contact.displayName = user.nickname;
      return contact;
    });

    contacts.push(...testContacts);

    await this.contactRepository
      .createQueryBuilder()
      .insert()
      .into(Contact)
      .values(contacts)
      .orUpdate(
        ['userId', 'phoneNumber', 'displayName'],
        ['userId', 'phoneNumber'],
      )
      .execute();

    return {
      message: 'Contacts created successfully',
      contactCount: contacts.length,
    };
  }

  async getContactsToInvite(
    userId: string,
    afterCursor: string | undefined,
    includedDisplayName: string | undefined,
  ) {
    // 이번 페이지의 첫 커서
    const firstCursor = afterCursor ? decodeCursor(afterCursor) : undefined;

    // 한 페이지에 몇 개를 보여줄지
    const take = 15;

    const omgFriendCount = await this.dataSource
      .createQueryBuilder()
      .subQuery()
      .select('COUNT(contact2.id)', 'omgFriendCount')
      .from(Contact, 'contact2')
      .where('contact2.phoneNumber = contact.phoneNumber')
      .getQuery();

    const querybuilder = this.contactRepository
      .createQueryBuilder('contact')
      .leftJoin('contact.contactInvite', 'contactInvite')
      .select('contact.id', 'id')
      .addSelect('contact.phoneNumber', 'phoneNumber')
      .addSelect('contact.displayName', 'displayName')
      .addSelect((qb) => {
        return qb
          .select('COUNT(contact2.id)', 'omgFriendCount')
          .from(Contact, 'contact2')
          .where('contact2.phoneNumber = contact.phoneNumber');
      }, 'omgFriendCount')
      .groupBy('contact.id')
      .orderBy({
        '"omgFriendCount"': 'DESC',
        'contact.id': 'DESC',
      })
      .where({ userId })
      .andWhere('( contactInvite.id IS NULL )')
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM "user" WHERE "user"."phoneNumber" = "contact"."phoneNumber")`,
      )
      .take(take + 1); // 다음 페이지의 첫 커서를 위해 하나 더 가져온다.

    if (firstCursor) {
      querybuilder.andHaving(
        `(
          ${omgFriendCount} < :omgFriendCount
        ) or
        (
          ${omgFriendCount} = :omgFriendCount AND contact.id <= :id
        )`,
        {
          omgFriendCount: firstCursor.omgFriendCount,
          id: firstCursor.id,
        },
      );
    }

    if (includedDisplayName)
      querybuilder.andWhere({
        displayName: Like(`%${includedDisplayName}%`),
      });

    const data = await querybuilder.getRawMany();

    let newAfterCursor = null;

    // 다음 페이지가 있는 경우: take + 1 개를 가져온다.
    if (data.length > take) {
      // 데이터 하나 빼고 커서 계산
      const lastData = data.pop();
      newAfterCursor = encodeCursor({
        id: lastData.id,
        omgFriendCount: lastData.omgFriendCount,
      });
    }

    return {
      afterCursor: newAfterCursor,
      data,
    };
  }

  async invite(userId: string, body: ContactInviteDTO) {
    const contact = await this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.contactInvite', 'contactInvite')
      .where('contact.phoneNumber = :phoneNumber', {
        phoneNumber: body.phoneNumber,
      })
      .andWhere('contact.userId = :userId', { userId })
      .getOne();

    if (!contact) {
      throw new BadRequestException(
        '전화번호에 해당하는 연락처가 존재하지 않습니다.',
      );
    }

    if (contact.contactInvite) {
      throw new BadRequestException(
        '이미 해당 연락처에 초대 메시지를 보냈습니다.',
      );
    }

    const contactInvite = this.contactInviteRepository.create({
      userId,
      phoneNumber: body.phoneNumber,
      reason: body.reason,
      contactId: contact.id,
    });

    return await this.contactInviteRepository.save(contactInvite);
  }
}
