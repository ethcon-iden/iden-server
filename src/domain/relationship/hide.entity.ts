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
@Unique(['hiderId', 'hiddenId'])
export class Hide extends BaseEntity {
  @ApiProperty({
    example: 1,
    description: 'DB id',
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '숨기는 유저 id',
  })
  @Column()
  hiderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hiderId' })
  hiderUser: User;

  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '숨겨지는 유저 id',
  })
  @Column()
  hiddenId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hiddenId' })
  hiddenUser: User;

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
