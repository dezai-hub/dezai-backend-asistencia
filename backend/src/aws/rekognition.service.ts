import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  CreateCollectionCommand,
} from '@aws-sdk/client-rekognition';

@Injectable()
export class RekognitionService implements OnModuleInit {
  private client: RekognitionClient;
  private collectionId: string;
  private readonly logger = new Logger(RekognitionService.name);

  constructor(private config: ConfigService) {
    this.collectionId = this.config.get<string>('AWS_REKOGNITION_COLLECTION')!;
    this.client = new RekognitionClient({
      region: this.config.get<string>('AWS_REGION')!,
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureCollectionExists();
  }

  private async ensureCollectionExists(): Promise<void> {
    try {
      await this.client.send(
        new CreateCollectionCommand({ CollectionId: this.collectionId }),
      );
      this.logger.log(`Rekognition collection '${this.collectionId}' created.`);
    } catch (error: any) {
      if (error.name === 'ResourceAlreadyExistsException') {
        this.logger.log(`Rekognition collection '${this.collectionId}' already exists.`);
      } else {
        this.logger.warn(`Could not ensure Rekognition collection: ${error.message}`);
      }
    }
  }

  async indexFace(bucket: string, key: string): Promise<string> {
    const response = await this.client.send(
      new IndexFacesCommand({
        CollectionId: this.collectionId,
        Image: {
          S3Object: { Bucket: bucket, Name: key },
        },
        MaxFaces: 1,
        DetectionAttributes: ['DEFAULT'],
      }),
    );

    const faceRecord = response.FaceRecords?.[0];
    if (!faceRecord?.Face?.FaceId) {
      throw new Error('No face detected in the image');
    }
    return faceRecord.Face.FaceId;
  }

  async searchFaceByImage(
    imageBuffer: Buffer,
  ): Promise<{ faceId: string; confidence: number } | null> {
    try {
      const response = await this.client.send(
        new SearchFacesByImageCommand({
          CollectionId: this.collectionId,
          Image: { Bytes: imageBuffer },
          FaceMatchThreshold: 90,
          MaxFaces: 1,
        }),
      );

      const match = response.FaceMatches?.[0];
      if (!match?.Face?.FaceId || !match.Similarity) {
        return null;
      }

      return {
        faceId: match.Face.FaceId,
        confidence: match.Similarity,
      };
    } catch {
      return null;
    }
  }

  async deleteFace(faceId: string): Promise<void> {
    await this.client.send(
      new DeleteFacesCommand({
        CollectionId: this.collectionId,
        FaceIds: [faceId],
      }),
    );
  }
}
