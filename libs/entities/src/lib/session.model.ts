import { ISession } from 'connect-typeorm';
import { BaseEntity, Column, Entity, Index, PrimaryColumn } from 'typeorm';

export interface ISessionData {
    cookie: {
        originalMaxAge: number;
        expires: string;
        secure: boolean;
        httpOnly: boolean;
        path: string;
    };
    passport?: {
        user: number;
    };
}

@Entity({
    name: 'session',
})
export class SessionModel extends BaseEntity implements ISession {

    @Index()
    @Column('bigint')
    public expiredAt = Date.now();

    @PrimaryColumn()
    public id!: string;

    @Column('text')
    public json!: string;
}
