import { filterArray } from '@ionaru/array-utils';
import { Column, Entity, ManyToOne, OneToMany, SelectQueryBuilder } from 'typeorm';

import { IAssignableModel } from './assignable.model';
import { BaseModel } from './base.model';
import { IImageableModel } from './imageable.model';
import { TeamspeakRankModel } from './teamspeak-rank.model';
import { UserModel } from './user.model';

@Entity({
    name: BadgeModel.alias,
    orderBy: {
        name: 'ASC',
    },
})
export class BadgeModel extends BaseModel implements IAssignableModel, IImageableModel {

    public static alias = 'badge';

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

    public static doQuery(): SelectQueryBuilder<BadgeModel> {
        return BadgeModel.createQueryBuilder(BadgeModel.alias);
    }

    public static async getTeamspeakGroups(): Promise<string[]> {
        const entities = await this.find({ relations: ['teamspeakRank'] });
        return filterArray(entities.map((e) => e.teamspeakRank?.id.toString()));
    }
}
