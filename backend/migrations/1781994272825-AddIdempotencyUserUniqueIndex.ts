import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdempotencyUserUniqueIndex1781994272825 implements MigrationInterface {
  name = 'AddIdempotencyUserUniqueIndex1781994272825';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "UQ_59d6b7756aeb6cbb43a093d15a1"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7198248833b8f79e09ffb9138a" ON "orders" ("user_id", "idempotency_key") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7198248833b8f79e09ffb9138a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "UQ_59d6b7756aeb6cbb43a093d15a1" UNIQUE ("idempotency_key")`,
    );
  }
}
