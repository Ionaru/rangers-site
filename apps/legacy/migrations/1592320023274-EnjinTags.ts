import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class EnjinTags1592320023274 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE `enjinTag` (`id` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB');
        await queryRunner.query('ALTER TABLE `role` ADD `enjinTagId` varchar(255) NULL');
        await queryRunner.query('ALTER TABLE `rank` ADD `enjinTagId` varchar(255) NULL');
        await queryRunner.query('ALTER TABLE `badge` ADD `enjinTagId` varchar(255) NULL');
        await queryRunner.query('ALTER TABLE `role` ADD CONSTRAINT `FK_abf451e73ceebf2901ed241fd40` FOREIGN KEY (`enjinTagId`) REFERENCES `enjinTag`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE `rank` ADD CONSTRAINT `FK_bde25d4d057ec851d6a24a60e35` FOREIGN KEY (`enjinTagId`) REFERENCES `enjinTag`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE `badge` ADD CONSTRAINT `FK_1e21e5ecf085dca1ece748a3853` FOREIGN KEY (`enjinTagId`) REFERENCES `enjinTag`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `badge` DROP FOREIGN KEY `FK_1e21e5ecf085dca1ece748a3853`');
        await queryRunner.query('ALTER TABLE `rank` DROP FOREIGN KEY `FK_bde25d4d057ec851d6a24a60e35`');
        await queryRunner.query('ALTER TABLE `role` DROP FOREIGN KEY `FK_abf451e73ceebf2901ed241fd40`');
        await queryRunner.query('ALTER TABLE `badge` DROP COLUMN `enjinTagId`');
        await queryRunner.query('ALTER TABLE `rank` DROP COLUMN `enjinTagId`');
        await queryRunner.query('ALTER TABLE `role` DROP COLUMN `enjinTagId`');
        await queryRunner.query('DROP TABLE `enjinTag`');
    }

}
