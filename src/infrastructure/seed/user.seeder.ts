import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataFactory, Seeder } from 'nestjs-seeder';
import { User } from 'src/domain/user/user.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class UserSeeder implements Seeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  seed(): Promise<any> {
    const users = DataFactory.createForClass(User).generate(70);

    return this.userRepository.insert(users);
  }
  drop(): Promise<any> {
    return this.userRepository.delete({ nickname: Like('TEST_%') });
  }
}
