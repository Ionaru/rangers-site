import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class Initial1579737215385 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `operation` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `application` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `badge` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `incident` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `description` text NOT NULL, `severity` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `rank` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `role` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `user` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `uuid` varchar(36) NOT NULL, `name` varchar(255) NOT NULL, `discordUser` varchar(255) NULL, `steamUser` varchar(255) NOT NULL, `rankId` int NULL, `ts3UserId` int NULL, UNIQUE INDEX `IDX_a95e949168be7b7ece1a2382fe` (`uuid`), UNIQUE INDEX `IDX_3a0b762515d1c58aa06c2e8bf0` (`discordUser`), UNIQUE INDEX `IDX_68c884c4f5fce0cccadaedd660` (`steamUser`), UNIQUE INDEX `REL_166ae27e83ef7b3383f54b6173` (`ts3UserId`), PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `teamspeakUser` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `uid` varchar(255) NOT NULL, `nickname` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `attendance` (`id` int NOT NULL AUTO_INCREMENT, `time` datetime NOT NULL, `operationId` int NOT NULL, `attendeeId` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `session` (`expiredAt` bigint NOT NULL, `id` varchar(255) NOT NULL, `json` text NOT NULL, INDEX `IDX_28c5d1d16da7908c97c9bc2f74` (`expiredAt`), PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `incident_users_user` (`incidentId` int NOT NULL, `userId` int NOT NULL, INDEX `IDX_3ef093700c0981bcec6f3eb11d` (`incidentId`), INDEX `IDX_624581ae4bc6079bbd5c3fd2bd` (`userId`), PRIMARY KEY (`incidentId`, `userId`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('ALTER TABLE `user` ADD CONSTRAINT `FK_946c8591c84929f761ca13c7356` FOREIGN KEY (`rankId`) REFERENCES `rank`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `user` ADD CONSTRAINT `FK_166ae27e83ef7b3383f54b61732` FOREIGN KEY (`ts3UserId`) REFERENCES `teamspeakUser`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `attendance` ADD CONSTRAINT `FK_134bce498b63c15461365867533` FOREIGN KEY (`operationId`) REFERENCES `operation`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `attendance` ADD CONSTRAINT `FK_cae89966587ea2fae4ab6334347` FOREIGN KEY (`attendeeId`) REFERENCES `teamspeakUser`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `incident_users_user` ADD CONSTRAINT `FK_3ef093700c0981bcec6f3eb11d2` FOREIGN KEY (`incidentId`) REFERENCES `incident`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `incident_users_user` ADD CONSTRAINT `FK_624581ae4bc6079bbd5c3fd2bdd` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `incident_users_user` DROP FOREIGN KEY `FK_624581ae4bc6079bbd5c3fd2bdd`', undefined);
        await queryRunner.query('ALTER TABLE `incident_users_user` DROP FOREIGN KEY `FK_3ef093700c0981bcec6f3eb11d2`', undefined);
        await queryRunner.query('ALTER TABLE `attendance` DROP FOREIGN KEY `FK_cae89966587ea2fae4ab6334347`', undefined);
        await queryRunner.query('ALTER TABLE `attendance` DROP FOREIGN KEY `FK_134bce498b63c15461365867533`', undefined);
        await queryRunner.query('ALTER TABLE `user` DROP FOREIGN KEY `FK_166ae27e83ef7b3383f54b61732`', undefined);
        await queryRunner.query('ALTER TABLE `user` DROP FOREIGN KEY `FK_946c8591c84929f761ca13c7356`', undefined);
        await queryRunner.query('DROP INDEX `IDX_624581ae4bc6079bbd5c3fd2bd` ON `incident_users_user`', undefined);
        await queryRunner.query('DROP INDEX `IDX_3ef093700c0981bcec6f3eb11d` ON `incident_users_user`', undefined);
        await queryRunner.query('DROP TABLE `incident_users_user`', undefined);
        await queryRunner.query('DROP INDEX `IDX_28c5d1d16da7908c97c9bc2f74` ON `session`', undefined);
        await queryRunner.query('DROP TABLE `session`', undefined);
        await queryRunner.query('DROP TABLE `attendance`', undefined);
        await queryRunner.query('DROP TABLE `teamspeakUser`', undefined);
        await queryRunner.query('DROP INDEX `REL_166ae27e83ef7b3383f54b6173` ON `user`', undefined);
        await queryRunner.query('DROP INDEX `IDX_68c884c4f5fce0cccadaedd660` ON `user`', undefined);
        await queryRunner.query('DROP INDEX `IDX_3a0b762515d1c58aa06c2e8bf0` ON `user`', undefined);
        await queryRunner.query('DROP INDEX `IDX_a95e949168be7b7ece1a2382fe` ON `user`', undefined);
        await queryRunner.query('DROP TABLE `user`', undefined);
        await queryRunner.query('DROP TABLE `role`', undefined);
        await queryRunner.query('DROP TABLE `rank`', undefined);
        await queryRunner.query('DROP TABLE `incident`', undefined);
        await queryRunner.query('DROP TABLE `badge`', undefined);
        await queryRunner.query('DROP TABLE `application`', undefined);
        await queryRunner.query('DROP TABLE `operation`', undefined);
    }

}
