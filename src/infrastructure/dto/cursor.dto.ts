import { ApiProperty } from '@nestjs/swagger';

export class CursorDTO {
  @ApiProperty({
    description: '이전 페이지의 커서 (존재하지 않으면 null)',
    example: '5x56NB==',
  })
  beforeCursor: string;

  @ApiProperty({
    description: '다음 페이지의 커서 (존재하지 않으면 null)',
    example: 'aWQ6NA==',
  })
  afterCursor: string;
}
