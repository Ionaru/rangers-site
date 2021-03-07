import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class RolesAndBadges1580462543454 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `user_roles_role` (`userId` int NOT NULL, `roleId` int NOT NULL, INDEX `IDX_5f9286e6c25594c6b88c108db7` (`userId`), INDEX `IDX_4be2f7adf862634f5f803d246b` (`roleId`), PRIMARY KEY (`userId`, `roleId`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `user_badges_badge` (`userId` int NOT NULL, `badgeId` int NOT NULL, INDEX `IDX_94a92189996bfd88e831172d8a` (`userId`), INDEX `IDX_8dd5b219046bbd7266cb82ed71` (`badgeId`), PRIMARY KEY (`userId`, `badgeId`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('ALTER TABLE `role` ADD `teamspeakRankId` int NULL', undefined);
        await queryRunner.query('ALTER TABLE `role` ADD UNIQUE INDEX `IDX_6f85229afe8bd677c92ab6f62a` (`teamspeakRankId`)', undefined);
        await queryRunner.query('ALTER TABLE `badge` ADD `teamspeakRankId` int NULL', undefined);
        await queryRunner.query('ALTER TABLE `badge` ADD UNIQUE INDEX `IDX_9daa3d2ca27dd05e5f5344af8a` (`teamspeakRankId`)', undefined);
        await queryRunner.query('ALTER TABLE `rank` ADD UNIQUE INDEX `IDX_2ea61327360beb75f9b3f8d455` (`name`)', undefined);
        await queryRunner.query('ALTER TABLE `role` ADD UNIQUE INDEX `IDX_ae4578dcaed5adff96595e6166` (`name`)', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `REL_6f85229afe8bd677c92ab6f62a` ON `role` (`teamspeakRankId`)', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `REL_9daa3d2ca27dd05e5f5344af8a` ON `badge` (`teamspeakRankId`)', undefined);
        await queryRunner.query('ALTER TABLE `role` ADD CONSTRAINT `FK_6f85229afe8bd677c92ab6f62a6` FOREIGN KEY (`teamspeakRankId`) REFERENCES `teamspeakRank`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `badge` ADD CONSTRAINT `FK_9daa3d2ca27dd05e5f5344af8a2` FOREIGN KEY (`teamspeakRankId`) REFERENCES `teamspeakRank`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `user_roles_role` ADD CONSTRAINT `FK_5f9286e6c25594c6b88c108db77` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `user_roles_role` ADD CONSTRAINT `FK_4be2f7adf862634f5f803d246b8` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `user_badges_badge` ADD CONSTRAINT `FK_94a92189996bfd88e831172d8ac` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `user_badges_badge` ADD CONSTRAINT `FK_8dd5b219046bbd7266cb82ed711` FOREIGN KEY (`badgeId`) REFERENCES `badge`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `user_badges_badge` DROP FOREIGN KEY `FK_8dd5b219046bbd7266cb82ed711`', undefined);
        await queryRunner.query('ALTER TABLE `user_badges_badge` DROP FOREIGN KEY `FK_94a92189996bfd88e831172d8ac`', undefined);
        await queryRunner.query('ALTER TABLE `user_roles_role` DROP FOREIGN KEY `FK_4be2f7adf862634f5f803d246b8`', undefined);
        await queryRunner.query('ALTER TABLE `user_roles_role` DROP FOREIGN KEY `FK_5f9286e6c25594c6b88c108db77`', undefined);
        await queryRunner.query('ALTER TABLE `badge` DROP FOREIGN KEY `FK_9daa3d2ca27dd05e5f5344af8a2`', undefined);
        await queryRunner.query('ALTER TABLE `role` DROP FOREIGN KEY `FK_6f85229afe8bd677c92ab6f62a6`', undefined);
        await queryRunner.query('DROP INDEX `REL_9daa3d2ca27dd05e5f5344af8a` ON `badge`', undefined);
        await queryRunner.query('DROP INDEX `REL_6f85229afe8bd677c92ab6f62a` ON `role`', undefined);
        await queryRunner.query('ALTER TABLE `role` DROP INDEX `IDX_ae4578dcaed5adff96595e6166`', undefined);
        await queryRunner.query('ALTER TABLE `rank` DROP INDEX `IDX_2ea61327360beb75f9b3f8d455`', undefined);
        await queryRunner.query('ALTER TABLE `badge` DROP INDEX `IDX_9daa3d2ca27dd05e5f5344af8a`', undefined);
        await queryRunner.query('ALTER TABLE `badge` DROP COLUMN `teamspeakRankId`', undefined);
        await queryRunner.query('ALTER TABLE `role` DROP INDEX `IDX_6f85229afe8bd677c92ab6f62a`', undefined);
        await queryRunner.query('ALTER TABLE `role` DROP COLUMN `teamspeakRankId`', undefined);
        await queryRunner.query('DROP INDEX `IDX_8dd5b219046bbd7266cb82ed71` ON `user_badges_badge`', undefined);
        await queryRunner.query('DROP INDEX `IDX_94a92189996bfd88e831172d8a` ON `user_badges_badge`', undefined);
        await queryRunner.query('DROP TABLE `user_badges_badge`', undefined);
        await queryRunner.query('DROP INDEX `IDX_4be2f7adf862634f5f803d246b` ON `user_roles_role`', undefined);
        await queryRunner.query('DROP INDEX `IDX_5f9286e6c25594c6b88c108db7` ON `user_roles_role`', undefined);
        await queryRunner.query('DROP TABLE `user_roles_role`', undefined);
    }

}
