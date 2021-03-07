import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class PermissionLinks1580296919826 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `rank_permissions_permission` (`rankId` int NOT NULL, `permissionId` int NOT NULL, INDEX `IDX_e8b0478f6101c2832852a729bd` (`rankId`), INDEX `IDX_a6df040685dad00dc6367a568c` (`permissionId`), PRIMARY KEY (`rankId`, `permissionId`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `role_permissions_permission` (`roleId` int NOT NULL, `permissionId` int NOT NULL, INDEX `IDX_b36cb2e04bc353ca4ede00d87b` (`roleId`), INDEX `IDX_bfbc9e263d4cea6d7a8c9eb3ad` (`permissionId`), PRIMARY KEY (`roleId`, `permissionId`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('ALTER TABLE `rank_permissions_permission` ADD CONSTRAINT `FK_e8b0478f6101c2832852a729bd6` FOREIGN KEY (`rankId`) REFERENCES `rank`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `rank_permissions_permission` ADD CONSTRAINT `FK_a6df040685dad00dc6367a568cb` FOREIGN KEY (`permissionId`) REFERENCES `permission`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `role_permissions_permission` ADD CONSTRAINT `FK_b36cb2e04bc353ca4ede00d87b9` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `role_permissions_permission` ADD CONSTRAINT `FK_bfbc9e263d4cea6d7a8c9eb3ad2` FOREIGN KEY (`permissionId`) REFERENCES `permission`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `role_permissions_permission` DROP FOREIGN KEY `FK_bfbc9e263d4cea6d7a8c9eb3ad2`', undefined);
        await queryRunner.query('ALTER TABLE `role_permissions_permission` DROP FOREIGN KEY `FK_b36cb2e04bc353ca4ede00d87b9`', undefined);
        await queryRunner.query('ALTER TABLE `rank_permissions_permission` DROP FOREIGN KEY `FK_a6df040685dad00dc6367a568cb`', undefined);
        await queryRunner.query('ALTER TABLE `rank_permissions_permission` DROP FOREIGN KEY `FK_e8b0478f6101c2832852a729bd6`', undefined);
        await queryRunner.query('DROP INDEX `IDX_bfbc9e263d4cea6d7a8c9eb3ad` ON `role_permissions_permission`', undefined);
        await queryRunner.query('DROP INDEX `IDX_b36cb2e04bc353ca4ede00d87b` ON `role_permissions_permission`', undefined);
        await queryRunner.query('DROP TABLE `role_permissions_permission`', undefined);
        await queryRunner.query('DROP INDEX `IDX_a6df040685dad00dc6367a568c` ON `rank_permissions_permission`', undefined);
        await queryRunner.query('DROP INDEX `IDX_e8b0478f6101c2832852a729bd` ON `rank_permissions_permission`', undefined);
        await queryRunner.query('DROP TABLE `rank_permissions_permission`', undefined);
    }

}
