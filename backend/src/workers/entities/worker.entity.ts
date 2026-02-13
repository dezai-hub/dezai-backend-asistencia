import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';

@Entity('workers')
export class Worker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  awsFaceId: string;

  @ManyToOne(() => User, (user) => user.workers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @Column()
  createdByUserId: string;

  @OneToMany(() => Attendance, (att) => att.worker)
  attendances: Attendance[];

  @CreateDateColumn()
  createdAt: Date;
}
