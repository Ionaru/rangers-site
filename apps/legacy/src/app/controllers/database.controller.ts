import { QueryLogger } from '@ionaru/typeorm-utils';
import {
    ApplicationModel,
    AttendanceModel,
    BadgeModel,
    IncidentModel,
    LOAModel,
    OperationModel,
    PermissionModel,
    RankModel,
    RoleModel,
    SessionModel,
    TeamspeakRankModel,
    TeamspeakUserModel,
    UserModel,
} from '@rangers-site/entities';
import { IController } from '@rangers-site/interfaces';
import { createConnection, getConnection, getConnectionOptions } from 'typeorm';

import { debug } from '../../debug';
import { DatabaseService } from '../services/database.service';

export class DatabaseController implements IController<DatabaseService> {

    private static readonly debug = debug.extend('DatabaseController');

    public async start(): Promise<DatabaseService> {

        DatabaseController.debug('Creating connection...');

        const connectionOptions = await getConnectionOptions('legacy');

        Object.assign(connectionOptions, {
            entities: [
                ApplicationModel,
                OperationModel,
                TeamspeakUserModel,
                TeamspeakRankModel,
                AttendanceModel,
                BadgeModel,
                IncidentModel,
                LOAModel,
                RankModel,
                RoleModel,
                SessionModel,
                UserModel,
                PermissionModel,
            ],
            logger: process.env.NODE_ENV !== 'production' ? new QueryLogger(debug) : undefined,
            logging: ['query', 'error'],
            name: 'default',
        });

        const connection = await createConnection(connectionOptions);

        DatabaseController.debug(`Database: ${connection.driver.database}`);
        DatabaseController.debug(`Entities: ${connection.entityMetadatas.map((entity) => entity.name).join(', ')}`);

        return new DatabaseService(connection);
    }

    public async stop(): Promise<void> {
        DatabaseController.debug('Disconnecting...');
        const connection = getConnection();
        if (connection.isConnected) {
            await connection.close();
        }
        DatabaseController.debug('Connection closed');
    }
}
