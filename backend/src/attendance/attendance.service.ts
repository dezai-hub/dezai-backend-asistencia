import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Attendance, SyncStatus } from './entities/attendance.entity';
import { RekognitionService } from '../aws/rekognition.service';
import { WorkersService } from '../workers/workers.service';
import { SyncRecordDto } from './dto/sync.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    private rekognitionService: RekognitionService,
    private workersService: WorkersService,
  ) {}

  async checkIn(
    imageBuffer: Buffer,
    gpsLat: number,
    gpsLong: number,
  ): Promise<Attendance> {
    // Search face in Rekognition
    const match = await this.rekognitionService.searchFaceByImage(imageBuffer);
    if (!match) {
      throw new UnauthorizedException('Face not recognized');
    }

    // Find worker by FaceId
    const worker = await this.workersService.findByFaceId(match.faceId);
    if (!worker) {
      throw new UnauthorizedException('Worker not found for matched face');
    }

    // Create attendance record
    const attendance = this.attendanceRepo.create({
      workerId: worker.id,
      checkInTime: new Date(),
      gpsLat,
      gpsLong,
      isVerified: true,
      syncStatus: SyncStatus.SYNCED,
    });

    const saved = await this.attendanceRepo.save(attendance);
    saved.worker = worker;
    return saved;
  }

  async checkOut(attendanceId: string): Promise<Attendance> {
    const attendance = await this.attendanceRepo.findOne({
      where: { id: attendanceId },
      relations: ['worker'],
    });
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    attendance.checkOutTime = new Date();
    return this.attendanceRepo.save(attendance);
  }

  async syncOfflineRecords(records: SyncRecordDto[]): Promise<Attendance[]> {
    const results: Attendance[] = [];

    for (const record of records) {
      let isVerified = false;

      // Optionally verify face if photo is provided
      if (record.photoBase64) {
        try {
          const imageBuffer = Buffer.from(record.photoBase64, 'base64');
          const match =
            await this.rekognitionService.searchFaceByImage(imageBuffer);
          isVerified = !!match;
        } catch (error) {
          this.logger.warn(`Face verification failed for sync record: ${error}`);
        }
      }

      const attendance = this.attendanceRepo.create({
        workerId: record.workerId,
        checkInTime: new Date(record.checkInTime),
        checkOutTime: record.checkOutTime
          ? new Date(record.checkOutTime)
          : undefined,
        gpsLat: record.gpsLat,
        gpsLong: record.gpsLong,
        isVerified,
        syncStatus: SyncStatus.SYNCED,
      });

      results.push(await this.attendanceRepo.save(attendance));
    }

    return results;
  }

  async findByUser(userId: string, userRole: string): Promise<Attendance[]> {
    if (userRole === UserRole.ADMIN) {
      return this.attendanceRepo.find({
        relations: ['worker'],
        order: { checkInTime: 'DESC' },
      });
    }

    return this.attendanceRepo.find({
      where: { worker: { createdByUserId: userId } },
      relations: ['worker'],
      order: { checkInTime: 'DESC' },
    });
  }

  async findToday(userId: string, userRole: string): Promise<Attendance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = { checkInTime: MoreThanOrEqual(today) };
    if (userRole !== UserRole.ADMIN) {
      where.worker = { createdByUserId: userId };
    }

    return this.attendanceRepo.find({
      where,
      relations: ['worker'],
      order: { checkInTime: 'DESC' },
    });
  }
}
