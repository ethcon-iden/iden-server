import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PhoneVerification {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  phoneNumber: string;

  @Column()
  code: string;

  @Column({ type: 'timestamptz' })
  validUntil: Date;
}
