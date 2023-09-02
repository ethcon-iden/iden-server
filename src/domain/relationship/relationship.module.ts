import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './block.entity';
import { Follow } from './follow.entity';
import { Hide } from './hide.entity';
import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';
import { User } from '../user/user.entity';
import { Contact } from '../contact/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Block, Contact, Follow, Hide, User])],
  controllers: [RelationshipController],
  providers: [RelationshipService],
  exports: [RelationshipService],
})
export class RelationshipModule {}
