import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CardService } from './card.service';
import { Auth } from 'src/infrastructure/decorators/auth.decorator';
import { UserRole } from 'src/infrastructure/enum/user-role.enum';
import {
  CardBatchResponseDTO,
  CardCommentDTO,
  CardCountsResponseDTO,
  CardFeedResponseDTO,
  CardReadDTO,
  CardResetResponseDTO,
  CardVoteDTO,
  CardVoteResponseDTO,
  ReceivedCardListResponseDTO,
  SentCardListResponseDTO,
  CardDetailResponseDTO,
  BestCardTypeResponseElementDTO,
  CardRecentResponseDTO,
} from './card.dto';
import { Card } from './card.entity';
import { BooleanEnum } from 'src/infrastructure/enum/boolean.enum';
import { CardLike } from './card-like.entity';
import { Gender } from '../user/user.entity';

@Controller('card')
@ApiTags('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get('count')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '카드 관련 수 가져오기',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      '카드 관련 수 가져오기 - 총 받은 카드 수 / 보낸 카드의 총 답글 수',
    type: CardCountsResponseDTO,
  })
  async getCounts(@Req() req: any) {
    return await this.cardService.getCounts(req.user.id);
  }

  @Get('received')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '받은 칭찬 가져오기',
  })
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
    name: 'userId',
    required: false,
    type: String,
    description:
      '존재하면, 이 user가 받은 칭찬을 가져옴 / 존재하지 않으면, 내가 받은 칭찬을 가져옴',
  })
  @ApiQuery({
    name: 'filterUnreadCard',
    required: false,
    type: 'enum',
    enum: BooleanEnum,
    description: '읽지 않은 칭찬만 가져옴',
  })
  @ApiQuery({
    name: 'senderGender',
    required: false,
    type: 'enum',
    enum: Gender,
  })
  @ApiQuery({
    name: 'filterNameRevealed',
    required: false,
    type: 'enum',
    enum: BooleanEnum,
    description:
      'true면 이름의 맨 마지막 글자 혹은 전체 이름이 공개된 칭찬만 가져옴',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '받은 칭찬 가져오기 - 카드를 반환한다.',
    type: ReceivedCardListResponseDTO,
  })
  async getReceivedCards(
    @Req() req: any,
    @Query('beforeCursor') beforeCursor: string | undefined,
    @Query('afterCursor') afterCursor: string | undefined,
    @Query('userId') userId: string | undefined,
    @Query('filterUnreadCard') filterUnreadCard: BooleanEnum | undefined,
    @Query('senderGender') senderGender: Gender | undefined,
    @Query('filterNameRevealed') filterNameRevealed: BooleanEnum | undefined,
  ) {
    return await this.cardService.getReceivedCards(
      req.user.id,
      beforeCursor,
      afterCursor,
      userId,
      filterUnreadCard,
      senderGender,
      filterNameRevealed,
    );
  }

  @Get('sent')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '보낸 칭찬 가져오기',
  })
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
    name: 'userId',
    required: false,
    type: String,
    description:
      '존재하면, 이 user가 보낸 칭찬을 가져옴 / 존재하지 않으면, 내가 보낸 칭찬을 가져옴',
  })
  @ApiQuery({
    name: 'filterCommented',
    required: false,
    type: 'enum',
    enum: BooleanEnum,
    description: '답글이 달린 칭찬만 가져옴',
  })
  @ApiQuery({
    name: 'receiverGender',
    required: false,
    type: 'enum',
    enum: Gender,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '보낸 칭찬 가져오기',
    type: SentCardListResponseDTO,
  })
  async getSentCards(
    @Req() req: any,
    @Query('beforeCursor') beforeCursor: string | undefined,
    @Query('afterCursor') afterCursor: string | undefined,
    @Query('userId') userId: string | undefined,
    @Query('filterCommented') filterCommented: BooleanEnum | undefined,
    @Query('receiverGender') receiverGender: Gender | undefined,
  ) {
    return await this.cardService.getSentCards(
      req.user.id,
      beforeCursor,
      afterCursor,
      userId,
      filterCommented,
      receiverGender,
    );
  }

  @Get('best')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '특정 유저가 받은 최고의 칭찬 질문들 세 개 가져오기',
  })
  @ApiParam({
    name: 'userId',
    description: '유저 아이디',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '특정 유저가 받은 최고의 칭찬 질문들 세 개 가져오기',
    type: BestCardTypeResponseElementDTO,
    isArray: true,
  })
  async getBestCards(@Req() req: any, @Query('userId') userId: string) {
    return await this.cardService.getBestCards(userId, req.user.id);
  }

  @Get('recent')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '특정 유저가 최근 3일 동안 받은 / 댓글이 달린 칭찬 가져오기',
  })
  @ApiQuery({
    name: 'userId',
    description: '유저 아이디',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'afterCursor',
    description: 'afterCursor',
    type: String,
  })
  @ApiQuery({
    name: 'beforeCursor',
    description: 'beforeCursor',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '특정 유저가 최근 3일 동안 받거나 댓글이 달린 칭찬 가져오기',
    type: CardRecentResponseDTO,
    isArray: true,
  })
  async getRecentCards(
    @Req() req: any,
    @Query('userId') userId: string,
    @Query('afterCursor') afterCursor: string | undefined,
    @Query('beforeCursor') beforeCursor: string | undefined,
  ) {
    return await this.cardService.getRecentCards(
      req.user.id,
      userId,
      afterCursor,
      beforeCursor,
    );
  }

  @Get('batch/open')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '열린 칭찬 배치 가져오기',
  })
  @ApiResponse({
    status: 200,
    description:
      '열린 칭찬 배치 가져오기 - 카드 배치와 응답하지 않은 카드를 반환한다.',
    type: CardBatchResponseDTO,
  })
  async getOpenBatch(@Req() req: any) {
    return await this.cardService.getOpenBatch(req.user.id);
  }

  @Get('feed')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '내가 팔로우하는 유저들이 받은 칭찬 피드 가져오기',
  })
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
    name: 'filterFavorite',
    required: false,
    type: 'enum',
    enum: BooleanEnum,
    description: '관심 친구 피드만 볼 것인지 여부',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      '내가 팔로우하는 유저들이 받은 칭찬 피드 가져오기 - 카드를 반환한다.',
    type: CardFeedResponseDTO,
  })
  async getFeed(
    @Req() req: any,
    @Query('beforeCursor') beforeCursor: string | undefined,
    @Query('afterCursor') afterCursor: string | undefined,
    @Query('filterFavorite') filterFavorite: BooleanEnum | undefined,
  ) {
    return await this.cardService.getFeed(
      req.user.id,
      beforeCursor,
      afterCursor,
      filterFavorite,
    );
  }

  @Get(':cardId')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '칭찬 하나 가져오기',
  })
  @ApiParam({
    name: 'cardId',
    description: '칭찬 아이디',
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '칭찬 가져오기 - 카드를 반환한다.',
    type: CardDetailResponseDTO,
  })
  async getCard(@Req() req: any, @Param('cardId') cardId: number) {
    return await this.cardService.getCard(req.user.id, cardId);
  }

  @Post('batch/start')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '칭찬 시작하기',
  })
  @ApiResponse({
    status: 200,
    description: '칭찬 시작하기 - 카드 배치를 반환한다.',
    type: CardBatchResponseDTO,
  })
  async start(@Req() req: any) {
    return await this.cardService.startBatch(req.user.id);
  }

  // 테스트용: 열린 배치 삭제하기
  @Delete('batch/open')
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  async deleteOpenBatch(@Req() req: any) {
    return await this.cardService.deleteOpenBatch(req.user.id);
  }

  @Post('read/all-received')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '내가 받은 카드 모두 읽음 처리하기',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카드 읽음 성공',
    type: null,
  })
  async readAllReceived(@Req() req: any) {
    return await this.cardService.readAllReceived(req.user.id);
  }

  @Post(':cardId/read')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '내가 받은 카드 / 보낸 카드의 댓글 읽음 처리하기',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '카드 읽음 성공',
    type: CardReadDTO,
  })
  async read(
    @Req() req: any,
    @Param('cardId') cardId: number,
    @Body() body: CardReadDTO,
  ) {
    return await this.cardService.read(req.user.id, cardId, body);
  }

  @Post(':cardId/vote')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '칭찬할 사람 투표하기',
  })
  @ApiResponse({
    status: 200,
    description: '칭찬할 사람 투표하기 - 카드를 반환한다.',
    type: CardVoteResponseDTO,
  })
  async vote(
    @Req() req: any,
    @Param('cardId') cardId: string,
    @Body() body: CardVoteDTO,
  ) {
    return await this.cardService.vote(req.user.id, cardId, body);
  }

  @Post(':cardId/reset')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '칭찬 선택지 초기화하기',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '칭찬 선택지 초기화하기 - 카드를 반환한다.',
    type: CardResetResponseDTO,
  })
  async reset(@Req() req, @Param('cardId') cardId: number) {
    return await this.cardService.reset(req.user.id, cardId);
  }

  @Post(':cardId/comment')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '내 칭찬에 답글 달기',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '내 칭찬에 답글 달기 - 카드를 반환한다.',
    type: Card,
  })
  async comment(
    @Req() req: any,
    @Body() body: CardCommentDTO,
    @Param('cardId') cardId: number,
  ) {
    return await this.cardService.comment(req.user.id, cardId, body);
  }

  @Delete(':cardId/comment')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '내 칭찬에 내가 단 답글 삭제하기',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '내 칭찬에 내가 단 답글 삭제하기 - 카드를 반환한다.',
    type: Card,
  })
  async deleteComment(@Req() req: any, @Param('cardId') cardId: number) {
    return await this.cardService.deleteComment(req.user.id, cardId);
  }

  @Post(':cardId/like')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '친구가 받은 칭찬에 좋아요 누르기',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '생성한 CardLike를 반환한다.',
    type: CardLike,
  })
  async like(@Req() req: any, @Param('cardId') cardId: number) {
    return await this.cardService.like(req.user.id, cardId);
  }

  @Post(':cardId/unlike')
  @Auth([UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '친구가 받은 칭찬에 좋아요 취소하기',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '삭제한 CardLike를 반환한다.',
    type: CardLike,
  })
  async unlike(@Req() req: any, @Param('cardId') cardId: number) {
    return await this.cardService.unlike(req.user.id, cardId);
  }
}
