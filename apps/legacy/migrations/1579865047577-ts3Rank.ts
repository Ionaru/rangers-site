import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class ts3Rank1579865047577 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `teamspeakRank` (`id` int NOT NULL, `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('ALTER TABLE `rank` ADD `teamspeakRankId` int NULL', undefined);
        await queryRunner.query('ALTER TABLE `rank` ADD UNIQUE INDEX `IDX_3794882ad6db1da4067a66db4a` (`teamspeakRankId`)', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `REL_3794882ad6db1da4067a66db4a` ON `rank` (`teamspeakRankId`)', undefined);
        await queryRunner.query('ALTER TABLE `rank` ADD CONSTRAINT `FK_3794882ad6db1da4067a66db4a3` FOREIGN KEY (`teamspeakRankId`) REFERENCES `teamspeakRank`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `rank` DROP FOREIGN KEY `FK_3794882ad6db1da4067a66db4a3`', undefined);
        await queryRunner.query('DROP INDEX `REL_3794882ad6db1da4067a66db4a` ON `rank`', undefined);
        await queryRunner.query('ALTER TABLE `rank` DROP INDEX `IDX_3794882ad6db1da4067a66db4a`', undefined);
        await queryRunner.query('ALTER TABLE `rank` DROP COLUMN `teamspeakRankId`', undefined);
        await queryRunner.query('DROP TABLE `teamspeakRank`', undefined);
    }

}
