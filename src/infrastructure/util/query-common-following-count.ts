import { User } from 'src/domain/user/user.entity';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { BooleanEnum } from '../enum/boolean.enum';
import { Contact } from 'src/domain/contact/contact.entity';
import { Follow } from 'src/domain/relationship/follow.entity';

/**
 * 공통 팔로잉 수를 구한다.
 * commonFollowingCount 로 쿼리 결과에 추가됨.
 * having에서 COUNT(follow.followerId) 혹은 ordery by 에서 "commonFollowingCount" 으로 사용 가능.
 */
export function queryCommonFollowingCount(
  querybuilder: SelectQueryBuilder<User>,
  isContactBased: BooleanEnum,
  userId: string,
  dataSource: DataSource,
) {
  querybuilder.addSelect('COUNT(follow.followerId)', 'commonFollowingCount');

  // 내 전화번호를 기반으로 공통 팔로잉 수를 구한다.
  if (isContactBased == BooleanEnum.TRUE) {
    // 내 전화번호 목록
    const myContacts = dataSource
      .createQueryBuilder()
      .subQuery()
      .select('contact.phoneNumber')
      .from(Contact, 'contact')
      .where({ userId: userId });

    querybuilder.leftJoin(
      'user.sentFollows',
      'follow',
      '"followedId" IN (' +
        dataSource
          .createQueryBuilder()
          .subQuery()
          .select('user.id')
          .from(User, 'user')
          .where(`user.phoneNumber IN (${myContacts.getQuery()}) `)
          .getQuery() +
        ')',
    );
  }

  // 실제 OMG 친구를 기반으로 공동 팔로잉 수를 구한다.
  else {
    // 내 팔로우 중인 사람 목록
    const myFollowings = dataSource
      .createQueryBuilder()
      .subQuery()
      .select('follow.followedId')
      .from(Follow, 'follow')
      .where({ followerId: userId });

    querybuilder.leftJoin(
      'user.sentFollows',
      'follow',
      '"followedId" IN (' +
        dataSource
          .createQueryBuilder()
          .subQuery()
          .select('user.id')
          .from(User, 'user')
          .where(`(user.id IN (${myFollowings.getQuery()})) `)
          .getQuery() +
        ')',
    );
  }
}
