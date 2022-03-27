import {
    Column,
    Entity,
    Generated,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToOne,
    SelectQueryBuilder,
} from 'typeorm';

import { ApplicationModel } from './application.model';
import { BadgeModel } from './badge.model';
import { BaseModel } from './base.model';
import { IncidentModel } from './incident.model';
import { RankModel } from './rank.model';
import { RoleModel } from './role.model';
import { TeamspeakUserModel } from './teamspeak-user.model';

@Entity({
    name: UserModel.alias,
})
export class UserModel extends BaseModel {

    public static alias = 'user';

    @Column({unique: true})
    @Generated('uuid')
    public uuid!: string;

    @Column()
    public name: string;

    @Column('boolean', {
        default: false,
    })
    public disabled = false;

    @ManyToMany(() => IncidentModel, (incident) => incident.users)
    public incidents!: IncidentModel[];

    @ManyToMany(() => RoleModel)
    @JoinTable()
    public roles!: RoleModel[];

    @ManyToMany(() => BadgeModel)
    @JoinTable()
    public badges!: BadgeModel[];

    @ManyToOne(() => RankModel, {
        eager: true,
        nullable: true,
    })
    public rank?: RankModel | null;

    @OneToOne(() => ApplicationModel, {
        nullable: true,
    })
    public application?: ApplicationModel | null;

    @Column({
        nullable: true,
        type: String,
        unique: true,
    })
    public discordUser?: string | null;

    @Column({
        nullable: true,
        type: String,
        unique: true,
    })
    public steamUser?: string | null;

    @Column({
        nullable: true,
        type: String,
        unique: true,
    })
    public enjinUser?: string | null;

    @OneToOne(() => TeamspeakUserModel, (ts3User) => ts3User.user, {
        eager: true,
        nullable: true,
    })
    @JoinColumn()
    public ts3User?: TeamspeakUserModel | null;

    public constructor(id: string, name: string) {
        super();
        this.discordUser = id;
        this.name = name;
    }

    public static doQuery(): SelectQueryBuilder<UserModel> {
        return UserModel.createQueryBuilder(UserModel.alias);
    }

    public toString(): string {
        return `User ${this.name} (#${this.id})`;
    }
}
