import { Column, Entity, OneToMany, OneToOne, SelectQueryBuilder } from 'typeorm';

import { AttendanceModel } from './attendance.model';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';

@Entity({
    name: TeamspeakUserModel.alias,
})
export class TeamspeakUserModel extends BaseModel {

    public static alias = 'teamspeakUser';

    @Column()
    public uid: string;

    @Column()
    public nickname: string;

    @OneToMany(() => AttendanceModel, (attendance) => attendance.attendee)
    public attendance!: AttendanceModel[];

    @OneToOne(() => UserModel, (user) => user.ts3User)
    public user?: UserModel;

    public constructor(uid: string, nickname: string) {
        super();
        this.uid = uid;
        this.nickname = nickname;
    }

    public static doQuery(): SelectQueryBuilder<TeamspeakUserModel> {
        return TeamspeakUserModel.createQueryBuilder(TeamspeakUserModel.alias);
    }
}
