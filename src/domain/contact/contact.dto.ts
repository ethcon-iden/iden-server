import { ApiProperty, PickType } from '@nestjs/swagger';
import { Contact } from './contact.entity';
import { ContactInviteReason } from './contact-invite.entity';

export class ContactDTO {
  @ApiProperty({
    type: PickType(Contact, ['displayName', 'phoneNumber']),
    description: '연락처',
    isArray: true,
  })
  contacts: Contact[];
}

export class ContactResponseDTO {
  @ApiProperty({
    type: String,
    description: '메시지',
    example: 'Contacts created successfully',
  })
  message: string;

  @ApiProperty({
    type: Number,
    description: '연락처 수',
  })
  contactCount: number;
}

class ContactElementDTO {
  @ApiProperty({
    type: Number,
    description: '연락처 아이디',
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    description: '연락처',
    example: '01012345678',
  })
  phoneNumber: string;

  @ApiProperty({
    type: String,
    description: '연락처 이름',
    example: '홍길동',
  })
  displayName: string;
}

export class ContactListResponseDTO {
  @ApiProperty({
    type: ContactElementDTO,
    isArray: true,
  })
  data: ContactElementDTO[];

  @ApiProperty({
    type: String,
    example: 'eyJpZCI6Niwib21nRnJpZW5kQ291bnQiOiIxIn0=',
    description: 'after cursor',
  })
  afterCursor: string;
}

export class ContactInviteDTO {
  @ApiProperty({
    type: ContactInviteReason,
    enum: ContactInviteReason,
    description:
      '연락처 초대 이유 - 만약 투표 시간 리셋 / 열람권 등의 이유가 없다면 null',
    nullable: true,
  })
  reason: ContactInviteReason;

  @ApiProperty({
    type: String,
    description: '연락처',
    example: '01012345678',
  })
  phoneNumber: string;
}
