import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Seeder } from 'nestjs-seeder';
import { RelationshipService } from 'src/domain/relationship/relationship.service';
import { User } from 'src/domain/user/user.entity';
import { Like, Repository } from 'typeorm';

export const testUserPhoneNumber = '01054209761';

@Injectable()
export class RelationshipSeeder implements Seeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly relationshipService: RelationshipService,
  ) {}

  async createRandomRelationship(senderId, recieverId) {
    const random = Math.random();
    if (random < 0.5) {
      return this.relationshipService.follow(senderId, recieverId);
    } else if (random < 0.55) {
      return this.relationshipService.block(senderId, recieverId);
    } else if (random < 0.6) {
      return this.relationshipService.hide(senderId, recieverId);
    }
  }

  async seed(): Promise<any> {
    const testUser = await this.userRepository.findOneBy({
      phoneNumber: testUserPhoneNumber,
    });
    const users = await this.userRepository.findBy({
      nickname: Like('TEST_%'),
    });
    for (const user of users) {
      this.createRandomRelationship(user.id, testUser.id);
      this.createRandomRelationship(testUser.id, user.id);
    }

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        if (Math.random() < 0.6) {
          // Adjust this number as necessary
          this.createRandomRelationship(users[i].id, users[j].id);
          this.createRandomRelationship(users[j].id, users[i].id);
        }
      }
    }
  }

  async drop(): Promise<any> {
    return null;
  }
}
