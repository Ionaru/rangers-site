import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class AttendanceCascadeRules1579738034655 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `attendance` DROP FOREIGN KEY `FK_134bce498b63c15461365867533`', undefined);
        await queryRunner.query('ALTER TABLE `attendance` DROP FOREIGN KEY `FK_cae89966587ea2fae4ab6334347`', undefined);
        await queryRunner.query('ALTER TABLE `attendance` ADD CONSTRAINT `FK_134bce498b63c15461365867533` FOREIGN KEY (`operationId`) REFERENCES `operation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', undefined);
        await queryRunner.query('ALTER TABLE `attendance` ADD CONSTRAINT `FK_cae89966587ea2fae4ab6334347` FOREIGN KEY (`attendeeId`) REFERENCES `teamspeakUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `attendance` DROP FOREIGN KEY `FK_cae89966587ea2fae4ab6334347`', undefined);
        await queryRunner.query('ALTER TABLE `attendance` DROP FOREIGN KEY `FK_134bce498b63c15461365867533`', undefined);
        await queryRunner.query('ALTER TABLE `attendance` ADD CONSTRAINT `FK_cae89966587ea2fae4ab6334347` FOREIGN KEY (`attendeeId`) REFERENCES `teamspeakUser`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
        await queryRunner.query('ALTER TABLE `attendance` ADD CONSTRAINT `FK_134bce498b63c15461365867533` FOREIGN KEY (`operationId`) REFERENCES `operation`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
    }

}
