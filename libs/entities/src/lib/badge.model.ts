import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { IAssignableModel } from './assignable.model';
import { BaseModel } from './base.model';
import { EnjinTagModel } from './enjin-tag.model';
import { IImageableModel } from './imageable.model';
import { TeamspeakRankModel } from './teamspeak-rank.model';
import { UserModel } from './user.model';

@Entity({
    name: BadgeModel.alias,
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
        nullable: true,
    })
    public teamspeakRank?: TeamspeakRankModel;

    @ManyToOne(() => EnjinTagModel, {
        nullable: true,
    })
    public enjinTag?: EnjinTagModel | null;
}
