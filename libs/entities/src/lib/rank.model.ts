import { filterArray } from '@ionaru/array-utils';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { IImageableModel } from './imageable.model';
import { PermissionModel } from './permission.model';
import { IPermissionableModel } from './permissionable.model';
import { TeamspeakRankModel } from './teamspeak-rank.model';
import { UserModel } from './user.model';

@Entity({
    name: RankModel.alias,
})
export class RankModel extends BaseModel implements IPermissionableModel, IImageableModel {

    public static alias = 'rank';

    @Column({
        unique: true,
    })
    public name!: string;

    @Column({
        nullable: true,
        type: String,
        unique: true,
    })
    public image?: string | null;

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

    // TODO: Rank on Discord

    public constructor(name: string) {
        super();
        this.name = name;
    }

    public static doQuery(): SelectQueryBuilder<RankModel> {
        return RankModel.createQueryBuilder(RankModel.alias);
    }

    public static async getTeamspeakGroups(): Promise<string[]> {
        const entities = await this.find({ relations: ['teamspeakRank'] });
        return filterArray(entities.map((e) => e.teamspeakRank?.id.toString()));
    }
}
