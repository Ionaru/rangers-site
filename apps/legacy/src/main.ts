import { format } from 'util';

import { handleExceptions, handleSignals } from '@ionaru/micro-web-service';
import { config } from 'dotenv';
import * as moment from 'moment-timezone';

import 'reflect-metadata'; // Required for TypeORM
import { LOACancelCommand } from './app/commands/loa-cancel.command';
import { LOACommand } from './app/commands/loa.command';
import { DatabaseController } from './app/controllers/database.controller';
import { DiscordBotController } from './app/controllers/discord-bot.controller';
import { ServerController } from './app/controllers/server.controller';
import { SlashCreatorController } from './app/controllers/slash-creator.controller';
import { TeamSpeakBotController } from './app/controllers/teamspeak-bot.controller';
import { AuthRoute } from './app/routes/auth.route';
import { BadgesRoute } from './app/routes/badges.route';
import { GlobalRoute } from './app/routes/global.route';
import { HandbookRoute } from './app/routes/handbook.route';
import { NotFoundRoute } from './app/routes/not-found.route';
import { OperationRoute } from './app/routes/operation.route';
import { OperationsRoute } from './app/routes/operations.route';
import { RanksRoute } from './app/routes/ranks.route';
import { RolesRoute } from './app/routes/roles.route';
import { RootRoute } from './app/routes/root.route';
import { UsersRoute } from './app/routes/users.route';
import { RecordOperationAttendeesTask } from './app/tasks/record-operation-attendees.task';
import { debug } from './debug';

const start = async () => {

    Error.stackTraceLimit = Infinity;

    config();

    debug('Hello!');
    debug(`NodeJS version ${process.version}`);

    // Lock locale to English.
    moment.locale('en');

    // Controllers
    const databaseController = new DatabaseController();
    const databaseService = await databaseController.start();

    await databaseService.syncPermissions();

    const teamSpeakBotController = new TeamSpeakBotController();
    const teamspeakService = await teamSpeakBotController.start();

    const discordBotController = new DiscordBotController();
    const discordService = await discordBotController.start();

    if (process.env.RANGERS_DISCORD_REGISTER_COMMANDS !== 'false') {
        const slashCreatorController = new SlashCreatorController();
        const slashCreatorService = await slashCreatorController.start(discordService);
        slashCreatorService.registerCommand((creator) => new LOACommand(creator, discordService));
        slashCreatorService.registerCommand((creator) => new LOACancelCommand(creator));
        await slashCreatorService.syncCommands();
    }

    // Tasks

    const operationAttendeesTask = new RecordOperationAttendeesTask(teamspeakService, databaseService);
    operationAttendeesTask.start();

    // Start server

    const serverController = new ServerController(databaseService, [
        ['*', new GlobalRoute()],
        ['/', new RootRoute()],
        ['/auth', new AuthRoute(discordService)],
        ['/ranks', new RanksRoute(teamspeakService, discordService)],
        ['/roles', new RolesRoute(teamspeakService, discordService)],
        ['/badges', new BadgesRoute(teamspeakService, discordService)],
        ['/op(eration)?', new OperationRoute()],
        ['/op(eration)?s', new OperationsRoute()],
        ['/handbook|/armaguide', new HandbookRoute()],
        ['/users', new UsersRoute(teamspeakService, discordService)],
        ['*', new NotFoundRoute()],
    ]);
    await serverController.start();

    // Handlers

    const stop = async () => {
        await serverController.stop();
        await discordBotController.stop();
        await teamSpeakBotController.stop();
        await databaseController.stop();
    };

    const exit = (code = 0) => {
        debug(`Auf Wiedersehen (${code})`);
        process.exit(code);
    };

    handleExceptions(stop, exit);
    handleSignals(stop, exit, debug);
};

start().then().catch((error) => {
    process.stderr.write(`${format(error)}\n`);
    process.exit(1);
});
