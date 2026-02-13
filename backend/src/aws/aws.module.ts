import { Module, Global } from '@nestjs/common';
import { S3Service } from './s3.service';
import { RekognitionService } from './rekognition.service';

@Global()
@Module({
  providers: [S3Service, RekognitionService],
  exports: [S3Service, RekognitionService],
})
export class AwsModule {}
