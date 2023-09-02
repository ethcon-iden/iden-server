import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { User } from './user.entity';
import { BooleanEnum } from 'src/infrastructure/enum/boolean.enum';
import { CursorDTO } from 'src/infrastructure/dto/cursor.dto';
import { Relationship } from './user.service';

export class SendVerificationCodeDTO {
  @ApiProperty({
    description: '휴대폰 번호',
    example: '01012345678',
  })
  phoneNumber: string;
}

export class SendVerificationCodeResponseDTO {
  // status
  @ApiProperty({
    description: '상태 코드 (202: 성공)',
    example: 202,
  })
  status: number;

  // message
  @ApiProperty({
    description: '상태 메시지',
    example: 'Accepted',
  })
  msg: string;

  // success
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;
}

export class VerifyPhoneNumberDTO {
  // phoneNumber
  @ApiProperty({
    description: '휴대폰 번호',
    example: '01012345678',
  })
  phoneNumber: string;

  // code
  @ApiProperty({
    description: '인증 코드',
    example: '123456',
  })
  code: string;
}

export class VerifyPhoneNumberResponseDTO {
  // phoneNumber
  @ApiProperty({
    description:
      '휴대폰 번호 인증토큰 - 1시간 동안 유효 / 기존 회원인 경우 빈 스트링',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTA5MjQ0NjI1MiIsImV4cCI6MTY4MjU4MjI1MiwiaWF0IjoxNjgyNTc4NjUyfQ.XE_zJw_AoXzpZPm-i_ZRUDlha3n2hy5rlAnfkWes7X4',
  })
  phoneNumberToken: string;
  // accessToken
  @ApiProperty({
    description: '액세스 토큰 - 계속 유효 / 새 회원인 경우 빈 스트링',
    example: '',
  })
  accessToken: string;

  // isNewUser
  @ApiProperty({
    description: '새 회원인지 여부',
    example: BooleanEnum.TRUE,
    required: true,
    type: BooleanEnum,
    enum: BooleanEnum,
  })
  isNewUser: BooleanEnum;
}

export class RegisterUserDTO extends PickType(User, [
  'phoneNumber',
  'name',
  'gender',
  'affiliation',
  'duty',
  'email',
]) {
  // profile image file
  @ApiProperty({
    description: '프로필 이미지 파일',
    type: 'string',
    format: 'binary',
    required: false,
  })
  profileImage: any;
}

export class UpdateUserDTO extends PartialType(
  PickType(User, ['name', 'gender', 'nickname', 'bio']),
) {
  // profile image file
  @ApiProperty({
    description: '프로필 이미지 파일',
    type: 'string',
    format: 'binary',
    required: false,
  })
  profileImage: any;

  // updated at change
  @ApiProperty({
    description: '업데이트 시간 변경 여부',
    example: BooleanEnum.TRUE,
    default: BooleanEnum.TRUE,
    required: false,
    type: BooleanEnum,
    enum: BooleanEnum,
  })
  updatedAtChange: BooleanEnum;
}

export class RegisterUserResponseDTO extends OmitType(User, []) {
  // accessToken
  @ApiProperty({
    description: '액세스 토큰 - 계속 유효',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Y2M2NTVhYS0xODZhLTQ1ZGItYjc0NC1jODEwNWQxZDQ2ODIiLCJpYXQiOjE2ODYxMTc4Njd9.2LPV3ZkQ_J0JWTwx8lWZeTqWFjKabgNut6B25MDRfzQ',
  })
  accessToken: string;
}

export class RetrieveUserResponseDTO extends User {
  // followerCount
  @ApiProperty({
    description: '팔로워 수',
    example: 0,
  })
  followerCount: number;

  // followingCount
  @ApiProperty({
    description: '팔로잉 수',
    example: 0,
  })
  followingCount: number;
}

export class SimpleUserDTO extends PickType(User, [
  'id',
  'nickname',
  'name',
  'profileImageKey',
  'gender',
]) {}

export class DetailUserResponseDTO extends PickType(User, [
  'id',
  'nickname',
  'name',
  'profileImageKey',
  'gender',
  'bio',
]) {
  // relationship
  @ApiProperty({
    description: 'API 요청자와의 관계',
    type: Relationship,
    enum: Relationship,
  })
  relationship: Relationship;
}

export class UserListResponseDTO {
  @ApiProperty({
    description: '유저들의 리스트',
    type: User,
    isArray: true,
  })
  data: User[];

  @ApiProperty({
    description: '전후 페이지의 커서',
    type: CursorDTO,
  })
  cursor: CursorDTO;
}

export class UserCountDTO {
  @ApiProperty({
    description: '받은 카드 수',
    example: 0,
    type: Number,
  })
  receivedCardsCount: number;

  @ApiProperty({
    description: '프로필 조회 수',
    example: 0,
    type: Number,
  })
  profileViewCount: number;

  @ApiProperty({
    description: '팔로워 수',
    example: 0,
    type: Number,
  })
  followerCount: number;

  @ApiProperty({
    description: '팔로잉 수',
    example: 0,
    type: Number,
  })
  followingCount: number;
}

export class RetrieveTokenDTO {
  @ApiProperty({
    description: '이메일',
    example: 'abc123@gmail.com',
  })
  email: string;
}

export class RetrieveTokenResponseDTO {
  @ApiProperty({
    description: '토큰',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjFjMzUzNS04NzM0LTQyYzYtOTY0Ni1mYzhlYTBkOGZiMzAiLCJyb2xlcyI6WyJVU0VSIl0sImlhdCI6MTY5MDM4MDMzMX0.8rHeX-jqG5GEiq1b9gpJ0M4CcXuYKxPe6up8p69jo90',
  })
  accessToken: string;
}

export class SendSplitKeyDTO {
  @ApiProperty({
    description: '이메일',
    example: 'abc123@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: '스플릿 키',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjFjMzUzNS04NzM0LTQyYzYtOTY0Ni1mYzhlYTBkOGZiMzAiLCJyb2xlcyI6WyJVU0VSIl0sImlhdCI6MTY5MDM4MDMzMX0.8rHeX-jqG5GEiq1b9gpJ0M4CcXuYKxPe6up8p69jo90',
  })
  splitKey: string;
}
