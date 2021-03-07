import { Column, Entity, SelectQueryBuilder, Unique } from 'typeorm';

import { BaseModel } from './base.model';

@Entity(LOAModel.alias)
@Unique(['date', 'user'])
export class LOAModel extends BaseModel {

    public static alias = 'loa';

    @Column('date')
    public date: Date;

    @Column()
    public user: string;

    public constructor(date: Date, user: string) {
        super();
        this.date = date;
        this.user = user;
    }

    public static doQuery(): SelectQueryBuilder<LOAModel> {
        return LOAModel.createQueryBuilder(LOAModel.alias);
    }
}
