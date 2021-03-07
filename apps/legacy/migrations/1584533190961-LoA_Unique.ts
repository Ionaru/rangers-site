import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class LoAUnique1584533190961 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE UNIQUE INDEX `IDX_1f538cbd9881a59c88ac98fed7` ON `loa` (`date`, `user`)', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `IDX_1f538cbd9881a59c88ac98fed7` ON `loa`', undefined);
    }

}
