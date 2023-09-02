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

@Entity()
@Unique(['blockerId', 'blockedId'])
export class Block extends BaseEntity {
  // db id
  @ApiProperty({
    example: 1,
    description: 'DB id',
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  // blocker id
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '차단하는 유저 id',
  })
  @Column()
  blockerId: string;

  // blocker user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockerId' })
  blockerUser: User;

  // blocked id
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '차단당하는 유저 id',
  })
  @Column()
  blockedId: string;

  // blocked user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockedId' })
  blockedUser: User;

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
