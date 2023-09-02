import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './follow.entity';
import { DataSource, In, IsNull, Like, Not, Repository } from 'typeorm';
import { Block } from './block.entity';
import { Hide } from './hide.entity';
import { FollowBatchDTO } from './relationship.dto';
import { User } from '../user/user.entity';
import { Contact } from '../contact/contact.entity';
import { BooleanEnum } from 'src/infrastructure/enum/boolean.enum';
import { decodeCursor, encodeCursor } from 'src/infrastructure/util/cursor';
import { queryCommonFollowingCount } from 'src/infrastructure/util/query-common-following-count';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectRepository(Follow) private followRepository: Repository<Follow>,
    @InjectRepository(Block) private blockRepository: Repository<Block>,
    @InjectRepository(Hide) private hideRepository: Repository<Hide>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private dataSource: DataSource,
  ) {}

  getUserQuerybuilder(userId: string) {
    const querybuilder = this.userRepository
      .createQueryBuilder('user')
      .where({ id: Not(userId) }, { userId })
      .andWhere(
        `user.id NOT IN (${this.dataSource
          .createQueryBuilder()
          .subQuery()
          .select('block.blockedId')
          .from(Block, 'block')
          .where({ blockerId: userId })
          .getQuery()})`,
      )
      .andWhere(
        `user.id NOT IN (${this.dataSource
          .createQueryBuilder()
          .subQuery()
          .select('block.blockerId')
          .from(Block, 'block')
          .where({ blockedId: userId })
          .getQuery()})`,
      )
      .andWhere(
        `user.id NOT IN (${this.dataSource
          .createQueryBuilder()
          .subQuery()
          .select('hide.hiddenId')
          .from(Hide, 'hide')
          .where({ hiderId: userId })
          .getQuery()})`,
      );

    return querybuilder;
  }

  async getFollowings(
    userId: string,
    isFavorite: BooleanEnum,
    includedName: string,
  ) {
    const subQuery = this.followRepository
      .createQueryBuilder()
      .subQuery()
      .select('follow.followedId')
      .from(Follow, 'follow')
      .where({ followerId: userId });

    if (isFavorite === BooleanEnum.TRUE) {
      subQuery.andWhere({ isFavorite: true });
    }

    const querybuilder = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.nickname',
        'user.name',
        'user.profileImageKey',
        'user.gender',
      ])
      .where(`(user.id IN (${subQuery.getQuery()}))`)
      .setParameters(subQuery.getParameters());

    if (includedName) {
      querybuilder.andWhere({ name: Like(`%${includedName}%`) });
    }

    return querybuilder.getMany();
  }

  async getBlocks(userId: string) {
    return await this.blockRepository
      .createQueryBuilder('block')
      .leftJoin('block.blockedUser', 'blockedUser')
      .where({ blockerId: userId })
      .select([
        // 차단 정보
        'block.id',
        'block.createdAt',
        // 차단한 유저 정보
        'blockedUser.id',
        'blockedUser.name',
        'blockedUser.profileImageKey',
        'blockedUser.gender',
      ])
      .getMany();
  }

  async getHides(userId: string) {
    return await this.hideRepository
      .createQueryBuilder('hide')
      .leftJoin('hide.hiddenUser', 'hiddenUser')
      .where({ hiderId: userId })
      .select([
        // 숨김 정보
        'hide.id',
        'hide.createdAt',
        // 숨긴 유저 정보
        'hiddenUser.id',
        'hiddenUser.name',
        'hiddenUser.profileImageKey',
        'hiddenUser.gender',
      ])
      .getMany();
  }

  async follow(followerId: string, followedId: string): Promise<Follow> {
    if (await this.followRepository.findOneBy({ followerId, followedId })) {
      throw new BadRequestException('이미 추가한 친구입니다.');
    }

    const follow = new Follow();
    follow.followerId = followerId;
    follow.followedId = followedId;

    const newFollow = await this.followRepository.save(follow);
    return newFollow;
  }

  async followBatch(
    followerId: string,
    body: FollowBatchDTO,
  ): Promise<Follow[]> {
    const follows = body.targetUserIds.map((targetUserId) => {
      const follow = new Follow();
      follow.followerId = followerId;
      follow.followedId = targetUserId;
      return follow;
    });

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(Follow)
      .values(follows)
      .orUpdate(['followerId', 'followedId'], ['followerId', 'followedId'])
      .execute();
    return await this.followRepository.save(follows);
  }

  async unfollow(followerId: string, followedId: string): Promise<Follow> {
    const follow = await this.followRepository.findOneBy({
      followerId,
      followedId,
    });

    if (!follow) {
      throw new BadRequestException('친구가 아닙니다.');
    }

    await this.followRepository.delete(follow.id);
    return follow;
  }

  async block(blockerId: string, blockedId: string): Promise<Block> {
    if (await this.blockRepository.findOneBy({ blockerId, blockedId })) {
      throw new BadRequestException('이미 차단한 유저입니다.');
    }

    // follow 관계가 있다면 삭제
    this.followRepository.delete({
      followerId: blockerId,
      followedId: blockedId,
    });

    // 차단
    const block = new Block();
    block.blockerId = blockerId;
    block.blockedId = blockedId;
    return await this.blockRepository.save(block);
  }

  async unblock(blockerId: string, blockedId: string): Promise<Block> {
    const block = await this.blockRepository.findOneBy({
      blockerId,
      blockedId,
    });

    if (!block) {
      throw new BadRequestException('차단한 유저가 아닙니다.');
    }

    await this.blockRepository.delete(block.id);
    return block;
  }

  async hide(hiderId: string, hiddenId: string) {
    if (await this.hideRepository.findOneBy({ hiderId, hiddenId })) {
      throw new BadRequestException('이미 숨긴 유저입니다.');
    }

    const hide = new Hide();
    hide.hiderId = hiderId;
    hide.hiddenId = hiddenId;
    return await this.hideRepository.save(hide);
  }

  async unhide(hiderId: string, hiddenId: string) {
    const hide = await this.hideRepository.findOneBy({
      hiderId,
      hiddenId,
    });

    if (!hide) {
      throw new BadRequestException('숨긴 유저가 아닙니다.');
    }

    await this.hideRepository.delete(hide.id);
    return hide;
  }

  async getNotReadFollowRecommendationContactCount(userId: string) {
    const querybuilder = this.getUserQuerybuilder(userId);

    // 내가 연락처로 가지고 있는 전화번호 중에 안 읽은 전화번호 목록
    const subQuery = this.dataSource
      .createQueryBuilder()
      .subQuery()
      .select('contact.phoneNumber', 'phoneNumber')
      .from(Contact, 'contact')
      .andWhere({ userId, readAt: IsNull() });

    const unReadContactRecommendationCount = await querybuilder
      .andWhere(`(user.phoneNumber In (${subQuery.getQuery()}))`)
      // 이미 팔로우 중인 사람들은 제외
      .andWhere(
        `(user.id NOT IN (${this.dataSource
          .createQueryBuilder()
          .subQuery()
          .select('follow.followedId')
          .from(Follow, 'follow')
          .where({ followerId: userId })
          .getQuery()}))`,
      )
      .setParameters(subQuery.getParameters())
      .getCount();

    return unReadContactRecommendationCount;
  }

  async followRecommendationContact(
    userId: string,
    isContactBased: BooleanEnum, // 공통 팔로잉 수 계산 시 내 연락처 기반인지 혹은 OMG 친구 기반인지 여부 : 첫 가입일 때는 true, 그 이후에 친구 추천 탭에서는 false
    includedName: string,
  ) {
    const querybuilder = this.getUserQuerybuilder(userId)
      .select('user.id', 'userId')
      .addSelect('user.name', 'name')
      .addSelect('user.profileImageKey', 'profileImageKey')
      .addSelect('user.gender', 'gender')
      .addSelect('user.phoneNumber', 'phoneNumber')
      .addSelect('user.affiliation', 'affiliation')
      .groupBy('user.id')
      .addGroupBy('user.name')
      .addGroupBy('user.profileImageKey');

    // isContactBased가 트루일 때는 팔로우 중인 사람을 제외할 필요가 없다. (첫 가입이므로)
    if (isContactBased === BooleanEnum.FALSE) {
      // 이미 팔로우 중인 사람들은 제외
      querybuilder.andWhere(
        `(user.id NOT IN (${this.dataSource
          .createQueryBuilder()
          .subQuery()
          .select('follow.followedId')
          .from(Follow, 'follow')
          .where({ followerId: userId })
          .getQuery()}))`,
      );
    }

    queryCommonFollowingCount(
      querybuilder,
      isContactBased,
      userId,
      this.dataSource,
    );

    if (includedName) {
      querybuilder.andWhere({ name: Like(`%${includedName}%`) });
    }

    // 내가 연락처로 가지고 있는 전화번호 목록
    const subQuery = this.dataSource
      .createQueryBuilder()
      .subQuery()
      .select('contact.phoneNumber', 'phoneNumber')
      .from(Contact, 'contact')
      .andWhere({ userId });

    querybuilder
      .andWhere(`(user.phoneNumber In (${subQuery.getQuery()}))`)
      .orderBy('"commonFollowingCount"', 'DESC')
      .setParameters(subQuery.getParameters());

    const data = await querybuilder.getRawMany();

    // 첫 가입이 아닐 때는 읽음 처리
    if (!isContactBased) {
      // 내가 연락처로 가지고 있는 전화번호 목록에서 친구 추가 추천을 받았으므로 읽음 처리
      this.contactRepository.update(
        {
          userId: userId,
          phoneNumber: In(data.map((d) => d.phoneNumber)),
        },
        {
          readAt: new Date(),
        },
      );
    }

    return {
      totalCount: data.length,
      data,
    };
  }

  // 내가 팔로우 하고 있는 유저들을 공통으로 팔로우하고 있는 유저들을 추천한다.
  async getFollowRecommendationCommon(
    userId: string,
    isContactBased: BooleanEnum,
    afterCursor: string | undefined,
    includedName: string | undefined,
  ) {
    // 이번 페이지의 첫 커서
    const firstCursor = afterCursor ? decodeCursor(afterCursor) : undefined;

    const querybuilder = this.getUserQuerybuilder(userId)
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect('user.profileImageKey', 'profileImageKey')
      .addSelect('user.gender', 'gender')
      .addSelect('user.affiliation', 'affiliation');

    queryCommonFollowingCount(
      querybuilder,
      isContactBased,
      userId,
      this.dataSource,
    );

    // 한 페이지에 몇 개를 보여줄지
    const take = 12;

    querybuilder
      .groupBy('user.id')
      .addGroupBy('user.name')
      .addGroupBy('user.profileImageKey')
      .having('COUNT(follow.followerId) >= 1')
      .orderBy('"commonFollowingCount"', 'DESC')
      .addOrderBy('id', 'DESC')
      .take(take + 1); // 다음 페이지의 첫 커서를 위해 하나 더 가져온다.

    if (firstCursor) {
      querybuilder.andHaving(
        '(COUNT(follow.followerId) < :commonFollowingCount OR COUNT(follow.followerId) = :commonFollowingCount AND user.id <= :id)',
        firstCursor,
      );
    }

    if (includedName) {
      querybuilder.andWhere({ name: Like(`%${includedName}%`) });
    }

    const data = await querybuilder.getRawMany();

    let newAfterCursor = null;

    // 다음 페이지가 있는 경우: take + 1 개를 가져온다.
    if (data.length > take) {
      // 데이터 하나 빼고 커서 계산
      const lastData = data.pop();
      newAfterCursor = encodeCursor({
        commonFollowingCount: lastData.commonFollowingCount,
        id: lastData.id,
      });
    }

    return {
      afterCursor: newAfterCursor,
      data,
    };
  }

  async favorite(userId: string, targetUserId: string) {
    const follow = await this.followRepository.findOneBy({
      followerId: userId,
      followedId: targetUserId,
    });

    if (!follow) {
      throw new BadRequestException('친구가 아닙니다.');
    }

    await this.followRepository.update(follow.id, { isFavorite: true });

    return {
      ...follow,
      isFavorite: true,
    };
  }

  async unfavorite(userId: string, targetUserId: string) {
    const follow = await this.followRepository.findOneBy({
      followerId: userId,
      followedId: targetUserId,
      isFavorite: true,
    });

    if (!follow) {
      return;
    }

    await this.followRepository.update(follow.id, { isFavorite: false });

    return {
      ...follow,
      isFavorite: false,
    };
  }
}
