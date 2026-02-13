import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncRecordDto {
  @IsString()
  workerId: string;

  @IsDateString()
  checkInTime: string;

  @IsDateString()
  @IsOptional()
  checkOutTime?: string;

  @IsNumber()
  gpsLat: number;

  @IsNumber()
  gpsLong: number;

  @IsString()
  @IsOptional()
  photoBase64?: string;
}

export class SyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRecordDto)
  records: SyncRecordDto[];
}
