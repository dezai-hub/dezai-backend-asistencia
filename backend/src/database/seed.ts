import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../users/entities/user.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  synchronize: false,
});

const SEED_USERS = [
  {
    name: 'Admin Global',
    email: 'admin@dezai.com',
    password: 'admin123',
    role: UserRole.ADMIN,
  },
  {
    name: 'Residente A',
    email: 'residente1@dezai.com',
    password: '123456',
    role: UserRole.RESIDENT,
  },
  {
    name: 'Residente B',
    email: 'residente2@dezai.com',
    password: '123456',
    role: UserRole.RESIDENT,
  },
];

async function seed() {
  await dataSource.initialize();
  console.log('Database connected for seeding.');

  const userRepo = dataSource.getRepository(User);

  for (const userData of SEED_USERS) {
    const existing = await userRepo.findOne({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`[SKIP] User already exists: ${userData.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = userRepo.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
    });

    await userRepo.save(user);
    console.log(`[CREATED] ${userData.role}: ${userData.email} (password: ${userData.password})`);
  }

  console.log('\nSeed complete!');
  console.log('Test accounts:');
  console.log('  ADMIN:      admin@dezai.com / admin123');
  console.log('  RESIDENT A: residente1@dezai.com / 123456');
  console.log('  RESIDENT B: residente2@dezai.com / 123456');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
