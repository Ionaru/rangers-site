import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class Permissions1580296338254 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('DROP INDEX `IDX_3794882ad6db1da4067a66db4a` ON `rank`', undefined);
        await queryRunner.query('CREATE TABLE `permission` (`id` int NOT NULL AUTO_INCREMENT, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `slug` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, UNIQUE INDEX `IDX_3379e3b123dac5ec10734b8cc8` (`slug`), PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('DROP INDEX `IDX_3379e3b123dac5ec10734b8cc8` ON `permission`', undefined);
        await queryRunner.query('DROP TABLE `permission`', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `IDX_3794882ad6db1da4067a66db4a` ON `rank` (`teamspeakRankId`)', undefined);
    }

}
