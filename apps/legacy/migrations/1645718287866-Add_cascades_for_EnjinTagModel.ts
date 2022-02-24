import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCascadesForEnjinTagModel1645718287866 implements MigrationInterface {
    name = 'AddCascadesForEnjinTagModel1645718287866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`role\` DROP FOREIGN KEY \`FK_abf451e73ceebf2901ed241fd40\``);
        await queryRunner.query(`ALTER TABLE \`rank\` DROP FOREIGN KEY \`FK_bde25d4d057ec851d6a24a60e35\``);
        await queryRunner.query(`ALTER TABLE \`badge\` DROP FOREIGN KEY \`FK_1e21e5ecf085dca1ece748a3853\``);
        await queryRunner.query(`ALTER TABLE \`role\` ADD CONSTRAINT \`FK_abf451e73ceebf2901ed241fd40\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`rank\` ADD CONSTRAINT \`FK_bde25d4d057ec851d6a24a60e35\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`badge\` ADD CONSTRAINT \`FK_1e21e5ecf085dca1ece748a3853\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`badge\` DROP FOREIGN KEY \`FK_1e21e5ecf085dca1ece748a3853\``);
        await queryRunner.query(`ALTER TABLE \`rank\` DROP FOREIGN KEY \`FK_bde25d4d057ec851d6a24a60e35\``);
        await queryRunner.query(`ALTER TABLE \`role\` DROP FOREIGN KEY \`FK_abf451e73ceebf2901ed241fd40\``);
        await queryRunner.query(`ALTER TABLE \`badge\` ADD CONSTRAINT \`FK_1e21e5ecf085dca1ece748a3853\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`rank\` ADD CONSTRAINT \`FK_bde25d4d057ec851d6a24a60e35\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role\` ADD CONSTRAINT \`FK_abf451e73ceebf2901ed241fd40\` FOREIGN KEY (\`enjinTagId\`) REFERENCES \`enjinTag\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
