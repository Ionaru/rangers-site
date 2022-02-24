import {MigrationInterface, QueryRunner} from "typeorm";

export class Upgrade1645582263080 implements MigrationInterface {
    name = 'Upgrade1645582263080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`enjinUser\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_893339acf2df5be7736f01b49f\` (\`enjinUser\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` MODIFY COLUMN \`uuid\` varchar(36) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` MODIFY COLUMN \`uuid\` char(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP INDEX \`IDX_893339acf2df5be7736f01b49f\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`enjinUser\``);
    }

}
