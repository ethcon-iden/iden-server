import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserUpdateHistory {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // user id
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: 'DB uuid',
  })
  @Column({ type: 'uuid' })
  userId: string;

  // nickname updated at
  @ApiProperty({
    example: '2021-08-01T00:00:00.000Z',
    description: '닉네임 변경 일시',
  })
  @Column({ type: 'timestamptz', nullable: true })
  nicknameUpdatedAt: Date;

  // name updated at
  @ApiProperty({
    example: '2021-08-01T00:00:00.000Z',
    description: '실명 변경 일시',
  })
  @Column({ type: 'timestamptz', nullable: true })
  nameUpdatedAt: Date;

  // school id updated at
  @ApiProperty({
    example: '2021-08-01T00:00:00.000Z',
    description: '학교 변경 일시',
  })
  @Column({ type: 'timestamptz', nullable: true })
  schoolIdUpdatedAt: Date;

  // grade updated at
  @ApiProperty({
    example: '2021-08-01T00:00:00.000Z',
    description: '학년 변경 일시',
  })
  @Column({ type: 'timestamptz', nullable: true })
  gradeUpdatedAt: Date;

  // gender updated at
  @ApiProperty({
    example: '2021-08-01T00:00:00.000Z',
    description: '성별 변경 일시',
  })
  @Column({ type: 'timestamptz', nullable: true })
  genderUpdatedAt: Date;

  // class updated at
  @ApiProperty({
    example: '2021-08-01T00:00:00.000Z',
    description: '반 변경 일시',
  })
  @Column({ type: 'timestamptz', nullable: true })
  classUpdatedAt: Date;
}
