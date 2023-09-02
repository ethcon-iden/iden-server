import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  DetailUserResponseDTO,
  RegisterUserResponseDTO,
  RetrieveTokenDTO,
  RetrieveTokenResponseDTO,
  RetrieveUserResponseDTO,
  SendSplitKeyDTO,
  UpdateUserDTO,
  UserCountDTO,
  UserListResponseDTO,
} from './user.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/infrastructure/decorators/public.decorator';
import { Auth } from 'src/infrastructure/decorators/auth.decorator';
import { UserRole } from 'src/infrastructure/enum/user-role.enum';
import { User } from './user.entity';
import { RegisterUserDTO } from './user.dto';
import { multerOptionsFactory } from 'src/infrastructure/factory/multer-options.factory';
import { UserUpdateHistory } from './user-update-history.entity';
import { BooleanEnum } from 'src/infrastructure/enum/boolean.enum';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth([UserRole.USER])
  @ApiQuery({
    name: 'beforeCursor',
    required: false,
    type: String,
    description: 'beforeCursor',
  })
  @ApiQuery({
    name: 'afterCursor',
    required: false,
    type: String,
    description: 'afterCursor',
  })
  @ApiQuery({
    name: 'exactNickname',
    required: false,
    type: String,
    description: '이 nickname과 정확히 일치하는 유저',
  })
  @ApiQuery({
    name: 'exactName',
    required: false,
    type: String,
    description: '이 name과 정확히 일치하는 유저',
  })
  @ApiQuery({
    name: 'includedNameOrNickname',
    required: false,
    type: String,
    description: '이 문자를 이름 또는 닉네임에 포함하는 유저',
  })
  @ApiQuery({
    name: 'following',
    required: false,
    enum: BooleanEnum,
    description: '내가 팔로우하는 사람만 검색 여부',
  })
  @ApiQuery({
    name: 'notFollowing',
    required: false,
    enum: BooleanEnum,
    description: '내가 팔로우하지 않는 사람만 검색 여부',
  })
  @ApiQuery({
    name: 'favoriteFollowing',
    required: false,
    enum: BooleanEnum,
    description: '내가 친한 친구로 팔로우하는 사람만 검색 여부',
  })
  @ApiQuery({
    name: 'following',
    required: false,
    enum: BooleanEnum,
    description: '내가 팔로우하는 사람만 검색 여부',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '유저 목록 조회',
    type: UserListResponseDTO,
  })
  async getUserList(
    @Query('beforeCursor') beforeCursor,
    @Query('afterCursor') afterCursor,
    @Query('exactNickname') exactNickname,
    @Query('exactName') exactName,
    @Query('includedNameOrNickname') includedNameOrNickname,
    @Query('following') following,
    @Query('notFollowing') notFollowing,
    @Req() req,
  ) {
    return await this.userService.retrieveUserList(
      req.user.id,
      beforeCursor,
      afterCursor,
      exactNickname,
      exactName,
      includedNameOrNickname,
      following,
      notFollowing,
    );
  }

  @Get('count')
  @Auth([UserRole.USER])
  @ApiOperation({
    summary:
      '내 프로필 / 다른 유저의 조회수, 팔로워, 팔로잉 수 조회 (userId가 없으면 내 프로필 조회)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: '특정 유저의 프로필 숫자 조회 / 없으면 내 프로필 숫자 조회',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserCountDTO,
  })
  async getProfileCounts(@Query('userId') userId, @Req() req) {
    return await this.userService.getProfileCounts(req.user.id, userId);
  }

  @Get('me')
  @Auth([UserRole.USER])
  @ApiResponse({
    status: HttpStatus.OK,
    description: '내 정보 조회',
    type: RetrieveUserResponseDTO,
  })
  async getMe(@Req() req) {
    return await this.userService.retrieveUserById(req.user.id);
  }

  @Get('me/update-history')
  @Auth([UserRole.USER])
  @ApiResponse({
    status: HttpStatus.OK,
    description: '내 정보 수정 이력 조회',
    type: UserUpdateHistory,
  })
  async getMeUpdateHistory(@Req() req) {
    return await this.userService.retrieveUserUpdateHistory(req.user.id);
  }

  @Get(':id')
  @Auth([UserRole.USER])
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: '유저 id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '유저 정보 조회',
    type: DetailUserResponseDTO,
  })
  async getUser(@Req() req, @Param('id') id) {
    return await this.userService.retrieveUserDetailById(id, req.user.id);
  }

  @Patch('me')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '내 정보 수정',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateUserDTO,
    schema: {
      type: 'object',
      properties: {
        profileImage: {
          type: 'file',
          format: 'binary',
          description:
            '프로필 이미지 파일 / 빈 스트링을 보내면 null로 초기화 / 이외의 경우에는 업데이트하지 않음',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '내 정보 수정',
    type: User,
  })
  @UseInterceptors(
    FileInterceptor('profileImage', multerOptionsFactory('user/profile-image')),
  )
  async updateMe(
    @Req() req,
    @Body() body: UpdateUserDTO,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    return await this.userService.updateMe(req.user.id, body, profileImage);
  }

  @Delete('me')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원 탈퇴 (soft delete)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '회원 탈퇴 성공',
    type: User,
  })
  async deleteMe(@Req() req) {
    return await this.userService.softDeleteUser(req.user.id);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @ApiOperation({
    summary: '회원가입',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: RegisterUserDTO,
    schema: {
      type: 'object',
      properties: {
        profileImage: {
          type: 'file',
          format: 'binary',
          description: '프로필 이미지 파일',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      '회원가입 성공 - 프로필 이미지는 파일로 전달하면 s3에 업로드 후 url을 저장',
    type: RegisterUserResponseDTO,
  })
  @UseInterceptors(
    FileInterceptor('profileImage', multerOptionsFactory('user/profile-image')),
  )
  async register(
    @Body() body: RegisterUserDTO,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    return await this.userService.register(body, profileImage);
  }

  @Post('token')
  @Public()
  @ApiResponse({
    status: HttpStatus.OK,
    description: '토큰 발급',
    type: RetrieveTokenResponseDTO,
  })
  @HttpCode(HttpStatus.OK)
  async getToken(@Body() body: RetrieveTokenDTO) {
    return {
      accessToken: await this.userService.generateTokenByEmail(body.email, [
        UserRole.USER,
      ]),
    };
  }

  @Post('mail')
  @Public()
  @ApiOperation({
    summary: '이메일로 스플릿 키 전송',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '이메일로 스플릿 키 전송 성공',
  })
  @HttpCode(HttpStatus.OK)
  async sendSplitKey(@Body() body: SendSplitKeyDTO) {
    return await this.userService.sendSplitKey(body);
  }
}
