import {MigrationInterface, QueryRunner} from "typeorm";

export class AddDiscordLinks1678646322345 implements MigrationInterface {
    name = 'AddDiscordLinks1678646322345'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`rank\` ADD \`discordRole\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`role\` ADD \`discordRole\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`badge\` ADD \`discordRole\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`badge\` DROP COLUMN \`discordRole\``);
        await queryRunner.query(`ALTER TABLE \`role\` DROP COLUMN \`discordRole\``);
        await queryRunner.query(`ALTER TABLE \`rank\` DROP COLUMN \`discordRole\``);
    }

}
