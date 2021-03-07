import { SessionModel } from '@rangers-site/entities';
import { BaseEntity, Connection, Repository, SaveOptions } from 'typeorm';

export class DatabaseService {

    public constructor(private readonly connection: Connection) { }

    public save(entities: BaseEntity[], options?: SaveOptions): Promise<BaseEntity[]> {
        return this.connection.manager.save(entities, options);
    }

    public getSessionRepository(): Repository<SessionModel> {
        return this.connection.getRepository(SessionModel);
    }
}
