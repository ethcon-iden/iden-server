import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Brackets, DataSource, Like, MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  RegisterUserDTO,
  RegisterUserResponseDTO,
  SendSplitKeyDTO,
  UpdateUserDTO,
} from './user.dto';
import { randomInt } from 'crypto';
import { BooleanEnum } from 'src/infrastructure/enum/boolean.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { buildPaginator } from 'typeorm-cursor-pagination';
import { UserUpdateHistory } from './user-update-history.entity';
import { Follow } from '../relationship/follow.entity';
import { PhoneVerification } from './phone-verification.entity';
import { ProfileViewCount } from './profile-view-count.entity';
import { getDateString } from 'src/infrastructure/util/get-date-string';
import { UserRole } from 'src/infrastructure/enum/user-role.enum';
import { MailerService } from '@nestjs-modules/mailer';

export enum Relationship {
  ME = 'ME',
  FAVORITE = 'FAVORITE',
  FOLLOWING = 'FOLLOWING',
  NONE = 'NONE',
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserUpdateHistory)
    private userUpdateHistoryRepository: Repository<UserUpdateHistory>,
    @InjectRepository(PhoneVerification)
    private phoneVerificationRepository: Repository<PhoneVerification>,
    @InjectRepository(ProfileViewCount)
    private profileViewCountRepository: Repository<ProfileViewCount>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    private readonly mailerService: MailerService,
  ) {}

  async retrieveUserById(id: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .loadRelationCountAndMap('user.followerCount', 'user.receivedFollows')
      .loadRelationCountAndMap('user.followingCount', 'user.sentFollows')
      .where({ id })
      .getOne();

    return user;
  }

  async retrieveUserDetailById(userId: string, myUserId: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where({ id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    const follow = await this.followRepository.findOneBy({
      followerId: myUserId,
      followedId: userId,
    });

    const relationship =
      userId === myUserId
        ? Relationship.ME
        : follow
        ? follow.isFavorite
          ? Relationship.FAVORITE
          : Relationship.FOLLOWING
        : Relationship.NONE;

    return {
      ...user,
      relationship,
    };
  }

  async retrieveUserList(
    userId: string,
    beforeCursor,
    afterCursor,
    exactNickname,
    exactName,
    includedNameOrNickname,
    following: BooleanEnum,
    notFollowing: BooleanEnum,
  ) {
    const querybuilder = await this.userRepository.createQueryBuilder('user');

    if (exactNickname) querybuilder.andWhere({ nickname: exactNickname });
    if (exactName) querybuilder.andWhere({ name: exactName });
    if (includedNameOrNickname)
      querybuilder.andWhere(
        new Brackets((qb) => {
          qb.where({
            nickname: Like(`%${includedNameOrNickname}%`),
          }).orWhere({
            name: Like(`%${includedNameOrNickname}%`),
          });
        }),
      );
    if (following === BooleanEnum.TRUE) {
      querybuilder
        .andWhere(
          `user.id IN (${this.dataSource
            .createQueryBuilder()
            .subQuery()
            .select('follow.followedId')
            .from(Follow, 'follow')
            .where('follow.followerId = :userId', { userId })
            .getQuery()})`,
        )
        .setParameter('userId', userId);
    }
    if (notFollowing === BooleanEnum.TRUE) {
      querybuilder
        .andWhere(
          `user.id NOT IN (${this.dataSource
            .createQueryBuilder()
            .subQuery()
            .select('follow.followedId')
            .from(Follow, 'follow')
            .where('follow.followerId = :userId', { userId })
            .getQuery()})`,
        )
        .setParameter('userId', userId);
    }

    const pagintor = await buildPaginator({
      entity: User,
      alias: 'user',
      paginationKeys: ['id'],
      query: {
        limit: 15,
        order: 'DESC',
        beforeCursor: beforeCursor,
        afterCursor: afterCursor,
      },
    });
    return await pagintor.paginate(querybuilder);
  }
  async getProfileCounts(myUserId: string, userId: string | undefined) {
    const tartgetId = userId || myUserId;

    const user = (await this.userRepository
      .createQueryBuilder('user')
      .loadRelationCountAndMap('user.receivedCardsCount', 'user.receivedCards')
      .loadRelationCountAndMap('user.sentFollowsCount', 'user.sentFollows')
      .loadRelationCountAndMap(
        'user.receivedFollowsCount',
        'user.receivedFollows',
      )
      .where({ id: tartgetId })
      .getOne()) as any;

    const today = getDateString(new Date());

    let profileViewCount = await this.profileViewCountRepository.findOneBy({
      userId: tartgetId,
      date: today,
    });

    if (!profileViewCount) {
      profileViewCount = await this.profileViewCountRepository.save({
        userId: tartgetId,
        count: 0,
        date: today,
      });
    }

    // 다른 사람의 프로필인 경우: 조회수 1 업데이트
    if (tartgetId !== myUserId) {
      await this.profileViewCountRepository.update(profileViewCount.id, {
        count: profileViewCount.count + 1,
      });
      profileViewCount.count += 1;
    }

    return {
      receivedCardsCount: user.receivedCardsCount,
      profileViewCount: profileViewCount.count,
      followingCount: user.sentFollowsCount,
      followerCount: user.receivedFollowsCount,
    };
  }

  async generateToken(id: string, roles: UserRole[]): Promise<string> {
    const payload = { sub: id, roles: roles };
    return this.jwtService.signAsync(payload);
  }

  async generateTokenByEmail(
    email: string,
    roles: UserRole[],
  ): Promise<string> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestException('Invalid email');
    }
    const { id } = user;

    const payload = { sub: id, roles: roles };
    return this.jwtService.signAsync(payload);
  }

  async generatePhoneNumberToken(phoneNumber: string): Promise<string> {
    // validate phone number for one hour
    const payload = {
      sub: phoneNumber,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };
    return this.jwtService.signAsync(payload);
  }

  async verifyPhoneNumberToken(
    phoneNumberToken: string,
    phoneNumber: string,
  ): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync(phoneNumberToken);
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new BadRequestException('Expired token');
      }
      if (payload.sub !== phoneNumber) {
        throw new BadRequestException('Invalid token');
      }
      return payload.sub;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async sendCodeSms(phoneNumber: string, code: string) {
    const message = `[OMG] 인증번호: ${code}\n인증번호를 입력해 주세요.`;

    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'local') {
      console.log(message);
      return {
        status: 202,
        msg: 'Accepted',
        success: true,
      };
    }

    console.log('sending sms to', phoneNumber, message);
  }

  async createCodeForPhoneNumber(phoneNumber: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.phoneVerificationRepository.delete({ phoneNumber });
    await this.phoneVerificationRepository.save({
      phoneNumber,
      code,
      validUntil: new Date(new Date().getTime() + 3 * 60 * 1000), // 3분 뒤
    });
    return code;
  }

  async getVerificationCode(phoneNumber: string): Promise<string | undefined> {
    return (
      await this.phoneVerificationRepository.findOneBy({
        phoneNumber,
        validUntil: MoreThan(new Date()),
      })
    ).code;
  }

  async generateUniqueNickname(name: string): Promise<string> {
    let nickname = name;
    let isUnique = false;

    while (!isUnique) {
      const randomDigits = randomInt(1000, 9999).toString();
      nickname = name + randomDigits;

      const existingUser = await this.userRepository.findOneBy({ nickname });
      isUnique = !existingUser;
    }

    return nickname;
  }

  async register(
    body: RegisterUserDTO,
    profileImage,
  ): Promise<RegisterUserResponseDTO> {
    console.log(body);
    const nickname = await this.generateUniqueNickname(body.name);

    const user = await this.userRepository.save({
      phoneNumber: body.phoneNumber,
      nickname,
      gender: body.gender,
      name: body.name,
      profileImageKey: profileImage?.key,
      email: body.email,
      affiliation: body.affiliation,
      duty: body.duty,
    });

    const accessToken = await this.generateToken(user.id, user.roles);

    // 알림 설정 생성
    // 이 유저를 연락처로 추가한 사람들에게 contact user 생성 (배지 띄우기 위함)
    this.eventEmitter.emitAsync('user.registered', user);

    return {
      accessToken,
      ...user,
    };
  }

  async updateMe(
    userId: string,
    body: UpdateUserDTO,
    profileImage,
  ): Promise<User> {
    const profileImageKey = profileImage
      ? profileImage.key
      : body?.profileImage === ''
      ? null
      : undefined;

    const updateHistory =
      (await this.userUpdateHistoryRepository.findOneBy({
        userId,
      })) ||
      (await this.userUpdateHistoryRepository.create({
        userId,
      }));

    await this.userRepository.update(userId, {
      ...body,
      profileImageKey,
    });

    if (body.updatedAtChange) {
      await this.userUpdateHistoryRepository.save(updateHistory);
    }

    return await this.userRepository.findOneBy({ id: userId });
  }

  async softDeleteUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'billings',
        'cookies',
        'fcms',
        'sentBlocks',
        'receivedBlocks',
        'sentFollows',
        'receivedFollows',
        'sentHides',
        'receivedHides',
        'notificationSetting',
        'omgPassBenefitHistories',
      ],
    });
    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }
    await this.userRepository.softRemove(user);

    // 카드만 따로 처리

    return user;
  }

  async hardDeleteUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    await this.userRepository.delete(user.id);
  }

  async recoverUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
      relations: [
        'billings',
        'cookies',
        'fcms',
        'sentBlocks',
        'receivedBlocks',
        'sentFollows',
        'receivedFollows',
        'sentHides',
        'receivedHides',
        'notificationSetting',
        'omgPassBenefitHistories',
      ],
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    await this.userRepository.recover(user);
    return user;
  }

  async retrieveUserUpdateHistory(userId: string): Promise<UserUpdateHistory> {
    return (
      (await this.userUpdateHistoryRepository.findOneBy({
        userId,
      })) ||
      (await this.userUpdateHistoryRepository.save({
        userId,
      }))
    );
  }

  async sendSplitKey(body: SendSplitKeyDTO) {
    const { email, splitKey } = body;
    const result = await this.mailerService.sendMail({
      to: email,
      from: '"IDEN" <june@trinitystudio.io.com>',
      subject: 'IDEN Recovery Key',
      text: `This is your recovery key for Iden In-App Wallet: ${splitKey}


[Security Tips]

Please record or store your recovery passphrase in a secure location.
Do not share it with anyone and keep it private.
If you lose or expose your recovery passphrase, you may lose access to your wallet.
Sending your recovery passphrase via email can be a security risk, so we recommend using an alternative method for backup.
`,
    });
  }
}
