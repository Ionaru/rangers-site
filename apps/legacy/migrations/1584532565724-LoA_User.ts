import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class LoAUser1584532565724 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('TRUNCATE TABLE `loa`');
        await queryRunner.query('ALTER TABLE `loa` ADD `user` varchar(255) NOT NULL', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `loa` DROP COLUMN `user`', undefined);
    }

}
