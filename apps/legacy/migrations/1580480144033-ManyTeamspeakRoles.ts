import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class ManyTeamspeakRoles1580480144033 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `rank` DROP FOREIGN KEY `FK_3794882ad6db1da4067a66db4a3`', undefined);
        await queryRunner.query('ALTER TABLE `badge` DROP FOREIGN KEY `FK_9daa3d2ca27dd05e5f5344af8a2`', undefined);
        await queryRunner.query('ALTER TABLE `role` DROP FOREIGN KEY `FK_6f85229afe8bd677c92ab6f62a6`', undefined);
        await queryRunner.query('DROP INDEX `REL_3794882ad6db1da4067a66db4a` ON `rank`', undefined);
        await queryRunner.query('DROP INDEX `IDX_6f85229afe8bd677c92ab6f62a` ON `role`', undefined);
        await queryRunner.query('DROP INDEX `REL_6f85229afe8bd677c92ab6f62a` ON `role`', undefined);
        await queryRunner.query('DROP INDEX `IDX_9daa3d2ca27dd05e5f5344af8a` ON `badge`', undefined);
        await queryRunner.query('DROP INDEX `REL_9daa3d2ca27dd05e5f5344af8a` ON `badge`', undefined);
        await queryRunner.query('ALTER TABLE `rank` ADD CONSTRAINT `FK_3794882ad6db1da4067a66db4a3` FOREIGN KEY (`teamspeakRankId`) REFERENCES `teamspeakRank`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `role` ADD CONSTRAINT `FK_6f85229afe8bd677c92ab6f62a6` FOREIGN KEY (`teamspeakRankId`) REFERENCES `teamspeakRank`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `badge` ADD CONSTRAINT `FK_9daa3d2ca27dd05e5f5344af8a2` FOREIGN KEY (`teamspeakRankId`) REFERENCES `teamspeakRank`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE UNIQUE INDEX `REL_9daa3d2ca27dd05e5f5344af8a` ON `badge` (`teamspeakRankId`)', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `IDX_9daa3d2ca27dd05e5f5344af8a` ON `badge` (`teamspeakRankId`)', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `REL_6f85229afe8bd677c92ab6f62a` ON `role` (`teamspeakRankId`)', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `IDX_6f85229afe8bd677c92ab6f62a` ON `role` (`teamspeakRankId`)', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `REL_3794882ad6db1da4067a66db4a` ON `rank` (`teamspeakRankId`)', undefined);
    }

}
