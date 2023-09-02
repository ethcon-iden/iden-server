import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  HttpCode,
  Get,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'src/infrastructure/enum/user-role.enum';
import { Auth } from 'src/infrastructure/decorators/auth.decorator';
import {
  ContactDTO,
  ContactInviteDTO,
  ContactListResponseDTO,
  ContactResponseDTO,
} from './contact.dto';
import { ContactService } from './contact.service';
import { ContactInvite } from './contact-invite.entity';

@Controller('contact')
@ApiTags('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary: '내 연락처 조회',
  })
  @ApiQuery({
    name: 'afterCursor',
    required: false,
    description: '이후 커서',
  })
  @ApiQuery({
    name: 'includedDisplayName',
    required: false,
    description: '이름 혹은 닉네임 포함',
  })
  @ApiResponse({
    status: 200,
    description: '연락처 조회 성공',
    type: ContactListResponseDTO,
  })
  async getContactsToInvite(
    @Req() req,
    @Query('afterCursor') afterCursor: string,
    @Query('includedDisplayName') includedDisplayName: string,
  ) {
    return await this.contactService.getContactsToInvite(
      req.user.id,
      afterCursor,
      includedDisplayName,
    );
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary: '연락처 등록 혹은 수정',
  })
  @ApiResponse({
    status: 200,
    description: '연락처 등록 혹은 수정 성공',
    type: ContactResponseDTO,
  })
  async create(@Req() req, @Body() body: ContactDTO) {
    return await this.contactService.createContacts(req.user.id, body);
  }

  @Post('invite')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary: '연락처에 있는 사람 초대 완료 후 서버에 알려줌',
  })
  @ApiResponse({
    status: 200,
    description: '연락처에 있는 사람 초대 완료 후 서버에 알려줌 성공',
    type: ContactInvite,
  })
  async invite(@Req() req, @Body() body: ContactInviteDTO) {
    return await this.contactService.invite(req.user.id, body);
  }
}
