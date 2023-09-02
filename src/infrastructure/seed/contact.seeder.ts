import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Seeder } from 'nestjs-seeder';
import { Contact } from 'src/domain/contact/contact.entity';
import { ContactService } from 'src/domain/contact/contact.service';
import { User } from 'src/domain/user/user.entity';
import { Like, Repository } from 'typeorm';

export const testUserPhoneNumber = '01054209761';

@Injectable()
export class ContactSeeder implements Seeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly contactService: ContactService,
  ) {}

  async seed(): Promise<any> {
    const testUser = await this.userRepository.findOneBy({
      phoneNumber: testUserPhoneNumber,
    });
    const users = await this.userRepository.findBy({
      nickname: Like('TEST_%'),
    });
    const contacts = [];
    for (const user of users) {
      if (Math.random() < 0.3) {
        contacts.push({
          displayName: user.nickname,
          phoneNumber: user.phoneNumber,
        });
      }
    }
    for (let i = 0; i < 5; i++) {
      contacts.push({
        displayName: 'TEST_' + i,
        phoneNumber: '0101234123' + i,
      });
    }

    await this.contactService.createContacts(testUser.id, { contacts });
  }

  async drop(): Promise<any> {
    console.log(
      'delete contacts >>>',
      await this.contactRepository.delete({
        displayName: Like('TEST_%'),
      }),
    );
  }
}
