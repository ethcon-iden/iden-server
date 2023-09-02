import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

export const FOLLOWING_VOTE_THRESHOLD = 4;

@Entity()
@Unique(['followerId', 'followedId'])
export class Follow extends BaseEntity {
  // db id
  @ApiProperty({
    example: 1,
    description: 'DB id',
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  // follower id
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '팔로우하는 유저 id',
  })
  @Column()
  followerId: string;

  // follower user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  followerUser: User;

  // following id
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '팔로우 당하는 유저 id',
  })
  @Column()
  followedId: string;

  // followed User
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followedId' })
  followedUser: User;

  // isFavorite: 관심 친구 여부
  @ApiProperty({
    example: false,
    description: '관심 친구 여부',
  })
  @Column({ default: false })
  isFavorite: boolean;

  // created at
  @ApiProperty({
    example: '2021-01-01 00:00:00',
    description: '생성일',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // deleted at
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: 'soft delete time',
    nullable: true,
  })
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deletedAt: Date;
}
