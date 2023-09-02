import { ApiProperty, PickType } from '@nestjs/swagger';
import { User } from '../user/user.entity';
import { Block } from './block.entity';
import { Hide } from './hide.entity';

export class RelationshipDTO {
  @ApiProperty({
    description:
      '새로 관계를 생성할 (팔로우/언팔로우/차단/차단해제/숨김/숨김해제) 유저의 id',
    example: 'e5b3f4c0-5f1a-4b0a-9b0a-0b9b6a4b3f4c',
  })
  targetUserId: string;
}

class BaseUserDTO extends PickType(User, [
  'id',
  'name',
  'gender',
  'profileImageKey',
  'affiliation',
]) {}

export class BlockElementDTO extends PickType(Block, ['id', 'createdAt']) {
  @ApiProperty({
    description: '차단당하는 유저',
    type: BaseUserDTO,
  })
  blockedUser: BaseUserDTO;
}

export class HideElementDTO extends PickType(Hide, ['id', 'createdAt']) {
  @ApiProperty({
    description: '숨김당하는 유저',
    type: BaseUserDTO,
  })
  hiddenUser: BaseUserDTO;
}

class FollowUserDTO extends PickType(User, [
  'id',
  'name',
  'gender',
  'profileImageKey',
]) {}

export class FollowingElementDTO extends PickType(Block, ['id']) {
  @ApiProperty({
    description: '팔로잉 유저',
    type: FollowUserDTO,
  })
  followedUser: User;
}

export class FollowBatchDTO {
  @ApiProperty({
    description: '새로 팔로우할 유저들의 id 배열',
    example: ['e5b3f4c0-5f1a-4b0a-9b0a-0b9b6a4b3f4c'],
    type: [String],
    isArray: true,
  })
  targetUserIds: string[];
}

class FollowRecommendElementDTO extends BaseUserDTO {
  // common friend count
  @ApiProperty({
    description: '함께 아는 친구 수',
    example: 3,
  })
  commonFollowingCount: number;
}

export class FollowRecommendationContactDTO {
  // total count
  @ApiProperty({
    description:
      '팔로우 추천 유저들의 총 수 - 내 연락처 중에 OMG 가입자의 총 수',
    example: 30,
  })
  totalCount: number;

  @ApiProperty({
    description: '팔로우 추천 유저들',
    type: FollowRecommendElementDTO,
    isArray: true,
  })
  data: FollowRecommendElementDTO[];
}

export class FollowRecommendationCommonDTO {
  // after cursor
  @ApiProperty({
    description: '다음 페이지를 위한 커서 - 다음 페이지가 없으면 null',
    example:
      'eyJjb21tb25Gb2xsb3dpbmdDb3VudCI6IjEiLCJpZCI6IjA3ZmVlZWFkLTMyOGYtNGE1ZC05N2Q3LTJlZTBiNzg2N2VmMCJ9',
  })
  afterCursor: string;

  @ApiProperty({
    description: '팔로우 추천 유저들',
    type: FollowRecommendElementDTO,
    isArray: true,
  })
  data: FollowRecommendElementDTO[];
}
