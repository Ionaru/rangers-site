import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class DiscordLoA1584530760439 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `loa` DROP FOREIGN KEY `FK_609ff83a30dac96c72ce203037d`', undefined);
        await queryRunner.query('ALTER TABLE `loa` DROP COLUMN `userId`', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `loa` ADD `userId` int NOT NULL', undefined);
        await queryRunner.query('ALTER TABLE `loa` ADD CONSTRAINT `FK_609ff83a30dac96c72ce203037d` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
    }

}
