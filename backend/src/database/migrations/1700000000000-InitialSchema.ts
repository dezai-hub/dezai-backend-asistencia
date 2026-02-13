import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'RESIDENT')
    `);
    await queryRunner.query(`
      CREATE TYPE "sync_status_enum" AS ENUM ('SYNCED', 'PENDING')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'RESIDENT',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create workers table
    await queryRunner.query(`
      CREATE TABLE "workers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "role" character varying NOT NULL,
        "photoUrl" character varying,
        "awsFaceId" character varying,
        "createdByUserId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workers_users" FOREIGN KEY ("createdByUserId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create attendances table
    await queryRunner.query(`
      CREATE TABLE "attendances" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workerId" uuid NOT NULL,
        "checkInTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "checkOutTime" TIMESTAMP WITH TIME ZONE,
        "gpsLat" numeric(10,7) NOT NULL,
        "gpsLong" numeric(10,7) NOT NULL,
        "isVerified" boolean NOT NULL DEFAULT false,
        "syncStatus" "sync_status_enum" NOT NULL DEFAULT 'SYNCED',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendances" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attendances_workers" FOREIGN KEY ("workerId")
          REFERENCES "workers"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_attendances_workerId" ON "attendances" ("workerId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_attendances_checkInTime" ON "attendances" ("checkInTime")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workers_createdByUserId" ON "workers" ("createdByUserId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "attendances"`);
    await queryRunner.query(`DROP TABLE "workers"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "sync_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
