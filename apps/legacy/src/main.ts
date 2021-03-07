import { format } from 'util';

import { handleExceptions, handleSignals } from '@ionaru/micro-web-service';
import { config } from 'dotenv';
import * as moment from 'moment-timezone';
import 'reflect-metadata'; // Required for TypeORM
import { DatabaseController } from './app/controllers/database.controller';
import { DiscordBotController } from './app/controllers/discord-bot.controller';
import { EnjinController } from './app/controllers/enjin.controller';
import { ServerController } from './app/controllers/server.controller';
import { TeamSpeakBotController } from './app/controllers/teamspeak-bot.controller';
import { AuthRoute } from './app/routes/auth.route';
import { GlobalRoute } from './app/routes/global.route';
import { NotFoundRoute } from './app/routes/not-found.route';
import { OperationRoute } from './app/routes/operation.route';
import { OperationsRoute } from './app/routes/operations.route';
import { RanksRoute } from './app/routes/ranks.route';
import { RolesRoute } from './app/routes/roles.route';
import { RootRoute } from './app/routes/root.route';
import { UsersRoute } from './app/routes/users.route';
import { RecordOperationAttendeesTask } from './app/tasks/record-operation-attendees.task';
import { PermissionModel } from '@rangers-site/entities';
import { debug } from './debug';

let serverController: ServerController;
let databaseController: DatabaseController;
let discordBotController: DiscordBotController;

const start = async () => {

    config();

    debug('Hello!');
    debug(`NodeJS version ${process.version}`);

    // Lock locale to English.
    moment.locale('en');

    databaseController = new DatabaseController();
    const databaseService = await databaseController.connect();

    await PermissionModel.syncPermissions();

    const teamSpeakBotController = new TeamSpeakBotController();
    const teamspeakService = await teamSpeakBotController.connect();

    discordBotController = new DiscordBotController();
    const discordService = await discordBotController.connect();

    const operationAttendeesService = new RecordOperationAttendeesTask(teamspeakService, databaseService);
    operationAttendeesService.start();

    const enjinController = new EnjinController();
    const enjinService = enjinController.connect();

    serverController = new ServerController(databaseService, [
        ['*', new GlobalRoute()],
        ['/', new RootRoute()],
        ['/auth', new AuthRoute(discordService)],
        ['/ranks', new RanksRoute(teamspeakService, enjinService)],
        ['/roles', new RolesRoute(teamspeakService, enjinService)],
        ['/op(eration)?', new OperationRoute()],
        ['/op(eration)?s', new OperationsRoute()],
        ['/users', new UsersRoute()],
        ['*', new NotFoundRoute()],
    ]);
    await serverController.start();

    handleExceptions(stop, exit);
    handleSignals(stop, exit, debug);
};

const stop = async () => {
    await serverController.stop();
    await discordBotController.disconnect();
    await databaseController.disconnect();
};

const exit = () => {
    debug('Auf Wiedersehen');
    process.exit(0);
};

start().then().catch((error) => {
    process.stderr.write(`${format(error)}\n`);
    process.exit(1);
});
