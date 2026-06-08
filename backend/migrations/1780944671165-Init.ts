import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1780944671165 implements MigrationInterface {
  name = 'Init1780944671165';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "is_admin" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."events_status_enum" AS ENUM('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED', 'SOLD_OUT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_title" character varying NOT NULL, "event_description" text, "total_tickets" integer NOT NULL, "available_tickets" integer NOT NULL, "price" numeric(10,2) NOT NULL, "status" "public"."events_status_enum" NOT NULL DEFAULT 'DRAFT', "starts_at" TIMESTAMP NOT NULL, "ends_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_status_enum" AS ENUM('AVAILABLE', 'RESERVED', 'SOLD', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seat_number" integer NOT NULL, "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'AVAILABLE', "price" numeric(10,2) NOT NULL, "event_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42aab8acd829dcf2e5d20e6139" ON "tickets" ("event_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotency_key" character varying NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING', "amount" numeric(10,2) NOT NULL, "user_id" integer NOT NULL, "event_id" uuid NOT NULL, "ticket_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_59d6b7756aeb6cbb43a093d15a1" UNIQUE ("idempotency_key"), CONSTRAINT "REL_78597268621a8df3476d38313c" UNIQUE ("ticket_id"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a922b820eeef29ac1c6800e826" ON "orders" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f77b38218fadae47c69713e57f" ON "orders" ("user_id", "status", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_bd5387c23fb40ae7e3526ad75ea" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_642ca308ac51fea8327e593b8ab" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_78597268621a8df3476d38313c2" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_78597268621a8df3476d38313c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_642ca308ac51fea8327e593b8ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_bd5387c23fb40ae7e3526ad75ea"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f77b38218fadae47c69713e57f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a922b820eeef29ac1c6800e826"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_42aab8acd829dcf2e5d20e6139"`,
    );
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
