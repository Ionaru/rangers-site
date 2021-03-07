import { QueryLogger } from '@ionaru/typeorm-utils';
import { createConnection, getConnection, getConnectionOptions } from 'typeorm';

import { debug } from '../../debug';
import { DatabaseService } from '../services/database.service';
import {
    ApplicationModel,
    AttendanceModel,
    BadgeModel,
    EnjinTagModel,
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

export class DatabaseController {

    private static readonly debug = debug.extend('DatabaseController');

    public async connect(): Promise<DatabaseService> {

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
                EnjinTagModel,
            ],
            logger: new QueryLogger(debug),
            logging: ['query', 'error'],
            name: 'default',
        });

        const connection = await createConnection(connectionOptions);

        DatabaseController.debug(`Database: ${connection.driver.database}`);
        DatabaseController.debug(`Entities: ${connection.entityMetadatas.map((entity) => entity.name).join(', ')}`);

        return new DatabaseService(connection);
    }

    public async disconnect(): Promise<void> {
        DatabaseController.debug('Disconnecting...');
        const connection = getConnection();
        if (connection.isConnected) {
            await connection.close();
        }
        DatabaseController.debug('Connection closed');
    }
}
