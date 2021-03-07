import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

import { BaseModel } from './base.model';
import { UserModel } from './user.model';

export enum IncidentSeverity {
    LOW,
    MEDIUM,
    HIGH,
}

@Entity({
    name: 'incident',
})
export class IncidentModel extends BaseModel {

    @Column({
        type: 'text',
    })
    public description: string;

    @Column()
    public severity: IncidentSeverity;

    @ManyToMany(() => UserModel, (user) => user.incidents)
    @JoinTable()
    public users: UserModel[];

    public constructor(description: string, severity: IncidentSeverity, users: UserModel[]) {
        super();
        this.description = description;
        this.severity = severity;
        this.users = users;
    }
}
