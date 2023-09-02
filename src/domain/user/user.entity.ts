import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/infrastructure/enum/user-role.enum';
import { Length, Matches } from 'class-validator';
import { Factory } from 'nestjs-seeder';
import { Faker, ko } from '@faker-js/faker';
import { Block } from '../relationship/block.entity';
import { Follow } from '../relationship/follow.entity';
import { Cookie } from '../item/cookie/cookie.entity';
import { Hide } from '../relationship/hide.entity';
import { Card } from '../card/card.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

const localFaker = new Faker({ locale: ko });

@Entity()
export class User extends BaseEntity {
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: 'DB uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // name 실명
  @ApiProperty({
    example: '홍길동',
    description: '실명 - 2~10자 한글만 사용 가능',
    nullable: false,
  })
  @Length(2, 10, { message: 'Name must be between 2 and 10 characters' })
  @Matches(/^[\uac00-\ud7a3]+$/u, {
    message: 'Name must contain only Korean characters',
  })
  @Factory(() => new Faker({ locale: [ko] }).person.fullName().replace(' ', ''))
  @Column()
  name: string;

  // nickname 닉네임
  @ApiProperty({
    example: '홍길동123',
    uniqueItems: true,
    description: `닉네임
  - Unique / 3~12자 영문, 숫자, 한글, 특수문자(-, _)만 사용 가능
  - 첫 가입시 자동생성`,
    nullable: false,
  })
  @Factory((faker, ctx) => 'TEST_' + ctx.name + faker.number.int(100))
  @Column({ nullable: true })
  nickname: string;

  // email 이메일
  @ApiProperty({
    example: 'abc123@gmail.com',
    description: '이메일 - 이메일 형식',
    nullable: true,
  })
  @Factory((faker) => faker.internet.email())
  @Column({ nullable: true })
  email: string;

  // phoneNumber 전화번호
  @ApiProperty({
    example: '01012345678',
    description: '전화번호 - 01012345678 형식',
    nullable: false,
  })
  @Factory((faker) => faker.phone.number('010########'))
  @Column({ nullable: true })
  phoneNumber: string;

  // gender 성별
  @ApiProperty({
    example: Gender.MALE,
    enum: Gender,
    description: `성별 - 남자: ${Gender.MALE}, 여자: ${Gender.FEMALE}`,
    nullable: false,
  })
  @Factory((faker) => faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]))
  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  // affiliation 소속
  @ApiProperty({
    example: '삼성 전자',
    description: '소속',
    nullable: true,
  })
  @Column({ nullable: true })
  @Factory((faker) =>
    faker.helpers.arrayElement([
      '삼성 전자',
      'LG 화학',
      '카카오',
      '네이버',
      '구글',
      '페이스북',
      '애플',
      '마이크로소프트',
      '아마존',
      '테슬라',
      '서울대학교',
      '연세대학교',
      '고려대학교',
      '한양대학교',
      'SK 하이닉스',
      'SK 텔레콤',
    ]),
  )
  affiliation: string;

  // duty 직무
  @ApiProperty({
    example: '백엔드 개발자',
    description: '직무',
    nullable: true,
  })
  @Column({ nullable: true })
  @Factory((faker) =>
    faker.helpers.arrayElement([
      '백엔드 개발자',
      '프론트엔드 개발자',
      '데이터 엔지니어',
      '데이터 사이언티스트',
      '웹 기획자',
      'UX 디자이너',
      'UI 디자이너',
      '그래픽 디자이너',
      '게임 기획자',
      '반도체 엔지니어',
      '전기 엔지니어',
      '전기정보공학부',
      '컴퓨터공학부',
      '정보통신공학부',
      '정보보호학과',
      '국어국문학과',
      '영어영문학과',
      '중어중문학과',
      '일어일문학과',
    ]),
  )
  duty: string;

  // bio
  @ApiProperty({
    example: '한 줄 소개 - 저는 학생입니다.',
    description: '한 줄 소개',
    nullable: true,
  })
  @Factory((faker) =>
    faker.helpers.arrayElement([
      localFaker.lorem.sentence(),
      faker.lorem.sentence(),
      null,
    ]),
  )
  @Column({ nullable: true })
  bio: string;

  // profile image key
  @ApiProperty({
    example: 'user/profile-image/1234567890.png',
    description: '프로필 이미지 키 - S3',
    nullable: false,
  })
  @Factory((faker) =>
    faker.helpers.arrayElement([
      'user/profile-image/' + faker.number.int({ min: 1, max: 38 }) + '.png',
      null,
    ]),
  )
  @Column({ nullable: true })
  profileImageKey: string;

  // identity title
  @ApiProperty({
    example: '소통에 능한 리더',
  })
  @Column({
    default: '논리적인 사고 방식의 소유자',
  })
  identityTitle: string;

  // identity content
  @ApiProperty({
    example:
      '소통에 능한 리더는 모든 조직원과의 협력을 통해 목표를 달성합니다.',
  })
  @Column({
    default:
      '김수겸 님은 합리적으로 사고하고 결정을 내리는 능력을 갖춘 사람입니다. 문제를 분석하고 관련된 정보를 적절하게 조합하여 문제를 해결하는데 능숙합니다. 객관적인 사실과 근거에 의존하여 주관적인 감정이나 편견에 빠지지 않으며, 잘못된 사고 패턴을 피하려고 노력합니다.',
  })
  identityContent: string;

  // identity reliability
  @ApiProperty({
    example: 90,
  })
  @Column({
    type: 'int',
    default: 10,
  })
  identityReliability: number;

  // createdAt
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: '생성일',
    nullable: true,
  })
  @Factory(() => new Date())
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // updatedAt
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: '수정일',
    nullable: true,
  })
  @UpdateDateColumn({ nullable: true, type: 'timestamptz' })
  updatedAt: Date;

  // last login at
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: '마지막 로그인 일시',
  })
  @Factory(() => new Date())
  @Column({ nullable: true, type: 'timestamptz' })
  lastLoginAt: Date;

  // deleted at
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: 'soft delete time',
    nullable: true,
  })
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deletedAt: Date;

  // roles
  @Column({
    nullable: true,
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.USER],
  })
  @Factory(() => [UserRole.USER])
  roles: UserRole[];

  // 내가 차단한 관계들
  @OneToMany(() => Block, (block) => block.blockerUser, {
    cascade: true,
  })
  sentBlocks: Block[];

  // 나를 차단한 관계들
  @OneToMany(() => Block, (block) => block.blockedUser, {
    cascade: true,
  })
  receivedBlocks: Block[];

  // 내가 팔로우한 관계들
  @OneToMany(() => Follow, (follow) => follow.followerUser, {
    cascade: true,
  })
  sentFollows: Follow[];

  // 나를 팔로우한 관계들
  @OneToMany(() => Follow, (follow) => follow.followedUser, {
    cascade: true,
  })
  receivedFollows: Follow[];

  // 내가 숨긴 관계들
  @OneToMany(() => Hide, (hide) => hide.hiderUser, {
    cascade: true,
  })
  sentHides: Hide[];

  // 나를 숨긴 관계들
  @OneToMany(() => Hide, (hide) => hide.hiddenUser, {
    cascade: true,
  })
  receivedHides: Hide[];

  @OneToMany(() => Cookie, (cookie) => cookie.user, {
    cascade: true,
  })
  cookies: Cookie[];

  @OneToMany(() => Card, (card) => card.sender, {
    cascade: true,
  })
  sentCards: Card[];

  @OneToMany(() => Card, (card) => card.receiver, {
    cascade: true,
  })
  receivedCards: Card[];
}
