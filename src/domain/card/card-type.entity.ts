import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';
import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Card } from './card.entity';

@Entity()
export class CardType extends BaseEntity {
  // db id
  @ApiProperty({
    example: '1',
    description: 'DB id',
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  // question
  @ApiProperty({
    example: '이 중에서 가장 잘 생긴 사람은?',
    description: '카드 질문',
  })
  @MaxLength(33)
  @Column({ type: 'varchar', length: 100, nullable: true })
  question: string;

  // emoji
  @ApiProperty({
    example: '👨‍🦰',
    description: '카드 이모지',
  })
  @Column({ nullable: true })
  emoji: string;

  @OneToMany(() => Card, (card) => card.cardType)
  cards: Card[];
}
