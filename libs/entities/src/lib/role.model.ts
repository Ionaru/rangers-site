import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { EnjinTagModel } from './enjin-tag.model';
import { PermissionModel } from './permission.model';
import { IPermissionableModel } from './permissionable.model';
import { TeamspeakRankModel } from './teamspeak-rank.model';
import { UserModel } from './user.model';

@Entity({
    name: RoleModel.alias,
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
        nullable: true,
    })
    public teamspeakRank?: TeamspeakRankModel | null;

    @ManyToOne(() => EnjinTagModel, {
        nullable: true,
    })
    public enjinTag?: EnjinTagModel | null;

    // TODO: Role on Discord

    public constructor(name: string) {
        super();
        this.name = name;
    }

    public static doQuery(): SelectQueryBuilder<RoleModel> {
        return RoleModel.createQueryBuilder(RoleModel.alias);
    }

}
