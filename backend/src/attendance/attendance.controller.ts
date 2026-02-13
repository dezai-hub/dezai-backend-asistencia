import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { SyncDto } from './dto/sync.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  @UseInterceptors(FileInterceptor('photo'))
  checkIn(
    @Body() dto: CheckInDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Photo is required');
    }
    return this.attendanceService.checkIn(file.buffer, dto.gpsLat, dto.gpsLong);
  }

  @Patch(':id/check-out')
  checkOut(@Param('id') id: string) {
    return this.attendanceService.checkOut(id);
  }

  @Post('sync')
  sync(@Body() dto: SyncDto) {
    return this.attendanceService.syncOfflineRecords(dto.records);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.attendanceService.findByUser(req.user.userId, req.user.role);
  }

  @Get('today')
  findToday(@Req() req: any) {
    return this.attendanceService.findToday(req.user.userId, req.user.role);
  }
}
