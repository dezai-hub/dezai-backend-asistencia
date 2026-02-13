import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Worker } from '../../workers/entities/worker.entity';

export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
}

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Worker, (w) => w.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workerId' })
  worker: Worker;

  @Column()
  workerId: string;

  @Column({ type: 'timestamptz' })
  checkInTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  checkOutTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  gpsLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  gpsLong: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'enum', enum: SyncStatus, default: SyncStatus.SYNCED })
  syncStatus: SyncStatus;

  @CreateDateColumn()
  createdAt: Date;
}
