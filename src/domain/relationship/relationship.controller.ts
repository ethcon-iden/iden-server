import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { Auth } from 'src/infrastructure/decorators/auth.decorator';
import { UserRole } from 'src/infrastructure/enum/user-role.enum';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Follow } from './follow.entity';
import {
  BlockElementDTO,
  FollowBatchDTO,
  FollowRecommendationCommonDTO,
  FollowRecommendationContactDTO,
  HideElementDTO,
  RelationshipDTO,
} from './relationship.dto';
import { Block } from './block.entity';
import { Hide } from './hide.entity';
import { BooleanEnum } from 'src/infrastructure/enum/boolean.enum';
import { SimpleUserDTO } from '../user/user.dto';

@Controller('relationship')
@ApiTags('relationship')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Get('following')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary: '내가 팔로우하는 사람들',
  })
  @ApiQuery({
    name: 'isFavorite',
    description: '관심 친구만 가져올지 여부',
    type: 'enum',
    enum: BooleanEnum,
    required: false,
  })
  @ApiQuery({
    name: 'includedName',
    description: '이름에 포함된 문자열',
    type: 'string',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '팔로잉 목록',
    type: SimpleUserDTO,
    isArray: true,
  })
  async getMyFollowings(
    @Req() req,
    @Query('isFavorite') isFavorite: BooleanEnum,
    @Query('includedName') includedName: string,
  ) {
    return await this.relationshipService.getFollowings(
      req.user.id,
      isFavorite,
      includedName,
    );
  }

  @Get('block')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary: '내가 차단한 사람들',
  })
  @ApiResponse({
    status: 200,
    description: '차단 목록',
    type: BlockElementDTO,
    isArray: true,
  })
  async getMyBlocks(@Req() req) {
    return await this.relationshipService.getBlocks(req.user.id);
  }

  @Get('hide')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary: '내가 숨긴 사람들',
  })
  @ApiResponse({
    status: 200,
    description: '숨김 목록',
    type: HideElementDTO,
    isArray: true,
  })
  async getMyHides(@Req() req) {
    return await this.relationshipService.getHides(req.user.id);
  }

  @Get('follow-recommend/contact')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary:
      '팔로우 추천: 내 연락처에 등록된 사람 중에 가입한 사람 / 공통팔로잉수 순으로 나열',
  })
  @ApiResponse({
    status: 200,
    description: '팔로우 추천 성공 - 페이지네이션 하지 않고 모두 보냄',
    type: FollowRecommendationContactDTO,
  })
  @ApiQuery({
    name: 'isContactBased',
    description:
      '공통 팔로잉 수 계산 시 내 연락처 기반인지 혹은 OMG 친구 기반인지 여부 : 첫 가입일 때는 true, 그 이후에 친구 추천 탭에서는 false',
    type: 'enum',
    enum: BooleanEnum,
    required: true,
    example: BooleanEnum.TRUE,
  })
  @ApiQuery({
    name: 'includedName',
    description: '이름에 포함된 문자열',
    type: 'string',
    required: false,
  })
  async followRecommendationContact(
    @Req() req,
    @Query('isContactBased') isContactBased: BooleanEnum,
    @Query('includedName') includedName: string,
  ) {
    return await this.relationshipService.followRecommendationContact(
      req.user.id,
      isContactBased,
      includedName,
    );
  }

  @Get('follow-recommend/common')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary: '팔로우 추천: 공통팔로잉수 순으로 나열',
  })
  @ApiResponse({
    status: 200,
    description: '팔로우 추천 성공',
    type: FollowRecommendationCommonDTO,
  })
  @ApiQuery({
    name: 'isContactBased',
    description:
      '공통 팔로잉 수 계산 시 내 연락처 기반인지 혹은 OMG 친구 기반인지 여부 : 첫 가입일 때는 true, 그 이후에 친구 추천 탭에서는 false',
    type: 'enum',
    enum: BooleanEnum,
    required: true,
    example: BooleanEnum.TRUE,
  })
  @ApiQuery({
    name: 'afterCursor',
    description:
      '지난 요청시 다음 페이지의 첫 커서 = 현재 요청시 페이지의 첫 커서',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'includedName',
    description: '이름에 포함된 문자열',
    type: 'string',
    required: false,
  })
  async followRecommendationCommon(
    @Req() req,
    @Query('isContactBased') isContactBased: BooleanEnum,
    @Query('afterCursor') afterCursor: string | undefined,
    @Query('includedName') includedName: string,
  ) {
    return await this.relationshipService.getFollowRecommendationCommon(
      req.user.id,
      isContactBased,
      afterCursor,
      includedName,
    );
  }

  @Post('follow')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiResponse({
    status: 200,
    description: '팔로우',
    type: Follow,
  })
  async follow(@Req() req, @Body() body: RelationshipDTO): Promise<Follow> {
    return await this.relationshipService.follow(
      req.user.id,
      body.targetUserId,
    );
  }

  @Post('follow/batch')
  @HttpCode(HttpStatus.OK)
  @Auth([UserRole.USER])
  @ApiOperation({
    summary: '연락처 배치로 팔로우',
  })
  @ApiResponse({
    status: 200,
    description: '팔로우',
    type: Follow,
  })
  async followBatch(
    @Req() req,
    @Body() body: FollowBatchDTO,
  ): Promise<Follow[]> {
    return await this.relationshipService.followBatch(req.user.id, body);
  }

  @Post('unfollow')
  @Auth([UserRole.USER])
  @ApiResponse({
    status: 200,
    description: '언팔로우',
    type: Follow,
  })
  async unfollow(@Req() req, @Body() body: RelationshipDTO): Promise<Follow> {
    return await this.relationshipService.unfollow(
      req.user.id,
      body.targetUserId,
    );
  }

  @Post('block')
  @Auth([UserRole.USER])
  @ApiResponse({
    status: 200,
    description: '차단',
    type: Block,
  })
  async block(@Req() req, @Body() body: RelationshipDTO): Promise<Block> {
    return await this.relationshipService.block(req.user.id, body.targetUserId);
  }

  @Post('unblock')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: '차단 해제',
    type: Block,
  })
  async unblock(@Req() req, @Body() body: RelationshipDTO): Promise<Block> {
    return await this.relationshipService.unblock(
      req.user.id,
      body.targetUserId,
    );
  }

  @Post('hide')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: '숨기기',
    type: Hide,
  })
  async hide(@Req() req, @Body() body: RelationshipDTO): Promise<Hide> {
    return await this.relationshipService.hide(req.user.id, body.targetUserId);
  }

  @Post('unhide')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: '숨기기 해제',
    type: Hide,
  })
  async unhide(@Req() req, @Body() body: RelationshipDTO): Promise<Hide> {
    return await this.relationshipService.unhide(
      req.user.id,
      body.targetUserId,
    );
  }

  @Post('favorite')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description:
      '관심 친구에 등록 - 팔로우 중인 친구만 등록 가능 / 피드에서 관심 친구 필터 사용 가능',
    type: Follow,
  })
  async favorite(@Req() req, @Body() body: RelationshipDTO) {
    return await this.relationshipService.favorite(
      req.user.id,
      body.targetUserId,
    );
  }

  @Post('unfavorite')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: '관심 친구에서 제거',
    type: Follow,
  })
  async unfavorite(@Req() req, @Body() body: RelationshipDTO) {
    return await this.relationshipService.unfavorite(
      req.user.id,
      body.targetUserId,
    );
  }
}
