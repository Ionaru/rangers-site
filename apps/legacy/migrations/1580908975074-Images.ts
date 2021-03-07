import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class Images1580908975074 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `rank` ADD `image` varchar(255) NULL', undefined);
        await queryRunner.query('ALTER TABLE `rank` ADD UNIQUE INDEX `IDX_0a3b42ce6cacc0afb641cd7f46` (`image`)', undefined);
        await queryRunner.query('ALTER TABLE `badge` ADD `image` varchar(255) NULL', undefined);
        await queryRunner.query('ALTER TABLE `badge` ADD UNIQUE INDEX `IDX_6866bd9ec1d7ed7c0b98949c6a` (`image`)', undefined);
        await queryRunner.query('ALTER TABLE `badge` ADD UNIQUE INDEX `IDX_35ed068bad78456ff543323916` (`name`)', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `badge` DROP INDEX `IDX_35ed068bad78456ff543323916`', undefined);
        await queryRunner.query('ALTER TABLE `badge` DROP INDEX `IDX_6866bd9ec1d7ed7c0b98949c6a`', undefined);
        await queryRunner.query('ALTER TABLE `badge` DROP COLUMN `image`', undefined);
        await queryRunner.query('ALTER TABLE `rank` DROP INDEX `IDX_0a3b42ce6cacc0afb641cd7f46`', undefined);
        await queryRunner.query('ALTER TABLE `rank` DROP COLUMN `image`', undefined);
    }

}
