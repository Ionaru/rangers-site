import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, SelectQueryBuilder } from 'typeorm';

import { OperationModel } from './operation.model';
import { TeamspeakUserModel } from './teamspeak-user.model';

@Entity({
    name: AttendanceModel.alias,
})
export class AttendanceModel extends BaseEntity {

    public static alias = 'attendance';

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public time: Date;

    @ManyToOne(() => OperationModel, (operation) => operation, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    public operation!: OperationModel;

    @ManyToOne(() => TeamspeakUserModel, (teamspeakUser) => teamspeakUser.attendance, {
        nullable: false,
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
    })
    public attendee!: TeamspeakUserModel;

    public constructor(time: Date, operation: OperationModel, attendee: TeamspeakUserModel) {
        super();
        this.time = time;
        this.operation = operation;
        this.attendee = attendee;
    }

    public static doQuery(): SelectQueryBuilder<AttendanceModel> {
        return AttendanceModel.createQueryBuilder(AttendanceModel.alias);
    }

}
