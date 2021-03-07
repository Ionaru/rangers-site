import { BaseEntity, Column, Entity, OneToOne, PrimaryColumn, SelectQueryBuilder } from 'typeorm';

import { BadgeModel } from './badge.model';
import { RankModel } from './rank.model';
import { RoleModel } from './role.model';

@Entity({
    name: TeamspeakRankModel.alias,
})
export class TeamspeakRankModel extends BaseEntity {

    public static alias = 'teamspeakRank';

    @PrimaryColumn()
    public id: number;

    @Column()
    public name: string;

    @OneToOne(() => RankModel, (rank) => rank.teamspeakRank)
    public rank?: RankModel;

    @OneToOne(() => RoleModel, (role) => role.teamspeakRank)
    public role?: RoleModel;

    @OneToOne(() => BadgeModel, (badge) => badge.teamspeakRank)
    public badge?: BadgeModel;

    public constructor(sgid: number, name: string) {
        super();
        this.id = sgid;
        this.name = name;
    }

    public static doQuery(): SelectQueryBuilder<TeamspeakRankModel> {
        return TeamspeakRankModel.createQueryBuilder(TeamspeakRankModel.alias);
    }
}
