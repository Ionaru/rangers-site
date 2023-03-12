import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveEnjin1678643914966 implements MigrationInterface {
    name = 'RemoveEnjin1678643914966'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`rank\` DROP FOREIGN KEY \`FK_bde25d4d057ec851d6a24a60e35\``);
        await queryRunner.query(`ALTER TABLE \`role\` DROP FOREIGN KEY \`FK_abf451e73ceebf2901ed241fd40\``);
        await queryRunner.query(`ALTER TABLE \`badge\` DROP FOREIGN KEY \`FK_1e21e5ecf085dca1ece748a3853\``);
        await queryRunner.query(`DROP INDEX \`IDX_893339acf2df5be7736f01b49f\` ON \`user\``);
        await queryRunner.query(`ALTER TABLE \`rank\` DROP COLUMN \`enjinTagId\``);
        await queryRunner.query(`ALTER TABLE \`role\` DROP COLUMN \`enjinTagId\``);
        await queryRunner.query(`ALTER TABLE \`badge\` DROP COLUMN \`enjinTagId\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`enjinUser\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`enjinUser\` varchar(255) CHARACTER SET "utf8" COLLATE "utf8_unicode_ci" NULL`);
        await queryRunner.query(`ALTER TABLE \`badge\` ADD \`enjinTagId\` varchar(255) CHARACTER SET "utf8" COLLATE "utf8_unicode_ci" NULL`);
        await queryRunner.query(`ALTER TABLE \`role\` ADD \`enjinTagId\` varchar(255) CHARACTER SET "utf8" COLLATE "utf8_unicode_ci" NULL`);
        await queryRunner.query(`ALTER TABLE \`rank\` ADD \`enjinTagId\` varchar(255) CHARACTER SET "utf8" COLLATE "utf8_unicode_ci" NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_893339acf2df5be7736f01b49f\` ON \`user\` (\`enjinUser\`)`);
        await queryRunner.query(`ALTER TABLE \`badge\` ADD CONSTRAINT \`FK_1e21e5ecf085dca1ece748a3853\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role\` ADD CONSTRAINT \`FK_abf451e73ceebf2901ed241fd40\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`rank\` ADD CONSTRAINT \`FK_bde25d4d057ec851d6a24a60e35\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
