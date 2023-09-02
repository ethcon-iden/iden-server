import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ContactInvite } from './contact-invite.entity';

@Entity()
@Unique(['userId', 'phoneNumber'])
export class Contact {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // userId
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: 'DB user id',
  })
  @Column({ type: 'uuid' })
  userId: string;

  // user
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  user: User;

  // name
  @ApiProperty({
    example: '홍길동',
    description: '이름',
    nullable: true,
  })
  @Column({ nullable: true })
  displayName: string;

  // phoneNumber
  @ApiProperty({
    example: '01012345678',
    description: '전화번호',
  })
  @Column({ nullable: true })
  phoneNumber: string;

  // createdAt
  @ApiProperty({
    example: '2021-01-01T00:00:00',
    description: '생성일',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // deletedAt
  @ApiProperty({
    example: '2021-01-01T00:00:00',
    description: '삭제일',
    nullable: true,
  })
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deletedAt: Date;

  // 내 연락처에 있는 친구가 OMG 가입했는데, 이를 읽은 시간 (null이면 읽지 않음)
  // 만약 내 연락처에 있는 친구가 OMG 가입하지 않았다면, null로 유지해야 함.
  @ApiProperty({
    example: '2021-01-01T00:00:00Z',
    description: '읽은 시간',
  })
  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date;

  @OneToOne(() => ContactInvite, (contactInvite) => contactInvite.contact)
  contactInvite: ContactInvite;
}
