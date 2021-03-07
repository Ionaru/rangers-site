import { BaseEntity, Column, Entity, OneToOne, PrimaryColumn, SelectQueryBuilder } from 'typeorm';

import { BadgeModel } from './badge.model';
import { RankModel } from './rank.model';
import { RoleModel } from './role.model';

@Entity({
    name: EnjinTagModel.alias,
})
export class EnjinTagModel extends BaseEntity {

    public static alias = 'enjinTag';

    @PrimaryColumn()
    public id: string;

    @Column()
    public name: string;

    @OneToOne(() => RankModel, (rank) => rank.teamspeakRank)
    public rank?: RankModel;

    @OneToOne(() => RoleModel, (role) => role.teamspeakRank)
    public role?: RoleModel;

    @OneToOne(() => BadgeModel, (badge) => badge.teamspeakRank)
    public badge?: BadgeModel;

    public constructor(id: string, name: string) {
        super();
        this.id = id;
        this.name = name;
    }

    public static doQuery(): SelectQueryBuilder<EnjinTagModel> {
        return EnjinTagModel.createQueryBuilder(EnjinTagModel.alias);
    }
}
