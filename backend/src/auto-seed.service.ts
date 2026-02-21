import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AutoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AutoSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Checking database seed...');
    
    // Check if the admin exists
    const existingAdmin = await this.userRepository.findOne({
      where: { email: 'admin@dezai.com' },
    });

    if (!existingAdmin) {
      this.logger.log('Admin not found, seeding database...');

      const adminPassword = await bcrypt.hash('admin123', 10);
      const residentePassword = await bcrypt.hash('123456', 10);

      const usersToSeed = [
        {
          name: 'Admin',
          email: 'admin@dezai.com',
          password: adminPassword,
          role: UserRole.ADMIN,
        },
        {
          name: 'Residente 1',
          email: 'residente1@dezai.com',
          password: residentePassword,
          role: UserRole.RESIDENT,
        },
        {
          name: 'Residente 2',
          email: 'residente2@dezai.com',
          password: residentePassword,
          role: UserRole.RESIDENT,
        },
      ];

      for (const userData of usersToSeed) {
        const user = this.userRepository.create(userData);
        await this.userRepository.save(user);
        this.logger.log(`Created user: ${user.email}`);
      }

      this.logger.log('Database seeded successfully.');
    } else {
      this.logger.log('Database already seeded, skipping.');
    }
  }
}
