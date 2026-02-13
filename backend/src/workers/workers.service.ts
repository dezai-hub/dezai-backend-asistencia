import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { Worker } from './entities/worker.entity';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { S3Service } from '../aws/s3.service';
import { RekognitionService } from '../aws/rekognition.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(Worker)
    private workersRepo: Repository<Worker>,
    private s3Service: S3Service,
    private rekognitionService: RekognitionService,
  ) {}

  async createWorker(
    dto: CreateWorkerDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Worker> {
    // 1. Resize image to max 800px width
    const resizedBuffer = await sharp(file.buffer)
      .resize(800, undefined, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // 2. Upload to S3
    const s3Key = `workers/${uuidv4()}.jpg`;
    const photoUrl = await this.s3Service.uploadPhoto(resizedBuffer, s3Key);

    // 3. Index face in Rekognition
    const awsFaceId = await this.rekognitionService.indexFace(
      this.s3Service.getBucket(),
      s3Key,
    );

    // 4. Save worker metadata
    const worker = this.workersRepo.create({
      name: dto.name,
      role: dto.role,
      photoUrl,
      awsFaceId,
      createdByUserId: userId,
    });

    return this.workersRepo.save(worker);
  }

  async findAllByUser(userId: string, userRole: string): Promise<Worker[]> {
    if (userRole === UserRole.ADMIN) {
      return this.workersRepo.find({ order: { createdAt: 'DESC' } });
    }
    return this.workersRepo.find({
      where: { createdByUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Worker> {
    const worker = await this.workersRepo.findOne({ where: { id } });
    if (!worker) {
      throw new NotFoundException('Worker not found');
    }
    return worker;
  }

  async findByFaceId(faceId: string): Promise<Worker | null> {
    return this.workersRepo.findOne({ where: { awsFaceId: faceId } });
  }

  async deleteWorker(id: string): Promise<void> {
    const worker = await this.findById(id);
    if (worker.awsFaceId) {
      await this.rekognitionService.deleteFace(worker.awsFaceId);
    }
    await this.workersRepo.remove(worker);
  }
}
