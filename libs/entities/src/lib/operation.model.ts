import { Entity, OneToMany, SelectQueryBuilder } from 'typeorm';

import { AttendanceModel } from './attendance.model';
import { BaseModel } from './base.model';

@Entity({
    name: OperationModel.alias,
})
export class OperationModel extends BaseModel {

    public static alias = 'operation';

    @OneToMany(() => AttendanceModel, (attendance) => attendance.operation)
    public attendance!: AttendanceModel[];

    public static doQuery(): SelectQueryBuilder<OperationModel> {
        return OperationModel.createQueryBuilder(OperationModel.alias);
    }
}
