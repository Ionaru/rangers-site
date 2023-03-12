import { filterArray } from '@ionaru/array-utils';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { PermissionModel } from './permission.model';
import { IPermissionableModel } from './permissionable.model';
import { TeamspeakRankModel } from './teamspeak-rank.model';
import { UserModel } from './user.model';

@Entity({
    name: RoleModel.alias,
    orderBy: {
        name: 'ASC',
    },
})
export class RoleModel extends BaseModel implements IPermissionableModel {

    public static alias = 'role';

    @Column({
        unique: true,
    })
    public name!: string;

    @ManyToMany(() => PermissionModel, {
        cascade: true,
        eager: true,
    })
    @JoinTable()
    public permissions!: PermissionModel[];

    @OneToMany(() => UserModel, (user) => user.rank)
    public users!: UserModel[];

    @ManyToOne(() => TeamspeakRankModel, {
        eager: true,
        nullable: true,
    })
    public teamspeakRank?: TeamspeakRankModel | null;

    @Column({
        nullable: true,
        type: String,
    })
    public discordRole?: string | null;

    public constructor(name: string) {
        super();
        this.name = name;
    }

    public static doQuery(): SelectQueryBuilder<RoleModel> {
        return RoleModel.createQueryBuilder(RoleModel.alias);
    }

    public static async getTeamspeakGroups(): Promise<string[]> {
        const entities = await this.find({ relations: ['teamspeakRank'] });
        return filterArray(entities.map((e) => e.teamspeakRank?.id.toString()));
    }
}
