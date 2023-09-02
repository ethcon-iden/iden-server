import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contact } from './contact.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ContactInviteReason {
  VOTE_WAITING_RESET = 'VOTE_WAITING_RESET',
  NAME_REVEAL_CHANCE = 'NAME_REVEAL_CHANCE',
}

@Entity()
export class ContactInvite {
  @ApiProperty({
    type: Number,
    description: '연락처 초대 아이디',
    example: 1,
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ApiProperty({
    type: String,
    description: '유저 아이디',
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    type: String,
    description: '연락처',
    example: '01012345678',
  })
  @Column()
  phoneNumber: string;

  @ApiProperty({
    type: Number,
    description: '연락처 id',
  })
  @Column({ type: 'int' })
  contactId: number;

  @OneToOne(() => Contact, (contact) => contact.contactInvite, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    enum: ContactInviteReason,
    type: String,
    description: '초대 이유',
    example: ContactInviteReason.VOTE_WAITING_RESET,
  })
  @Column({ nullable: true, enum: ContactInviteReason })
  reason: ContactInviteReason;

  @ApiProperty({
    type: Boolean,
    description:
      '투표 대기 시간 초기화를 위한 초대인 경우, 이 초대를 이용해서 투표 대기 시간을 초기화했는지 여부',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  didResetCardCooldown: boolean;
}
