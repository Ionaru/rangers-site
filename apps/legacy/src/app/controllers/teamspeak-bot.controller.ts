// tslint:disable-next-line:no-submodule-imports
import { IController } from '@rangers-site/interfaces';
import { TeamSpeak } from 'ts3-nodejs-library/lib';

import { debug } from '../../debug';
import { TeamspeakService } from '../services/teamspeak.service';

export class TeamSpeakBotController implements IController<TeamspeakService> {

    private static readonly debug = debug.extend('TeamSpeakBotController');

    private readonly client: TeamSpeak;

    public constructor() {
        TeamSpeakBotController.debug('Construct');

        const host = process.env.RANGERS_TS_HOST;
        const nickname = process.env.RANGERS_TS_NICKNAME;
        const username = process.env.RANGERS_TS_USERNAME;
        const password = process.env.RANGERS_TS_PASSWORD;

        if (!host || !username || !password || !nickname) {
            throw new Error('TS3 configuration error! Login credentials invalid.');
        }

        const queryPort = Number(process.env.RANGERS_TS_QUERY_PORT);
        const serverPort = Number(process.env.RANGERS_TS_PORT);

        if (isNaN(queryPort) || isNaN(serverPort)) {
            throw new Error('TS3 configuration error! Port invalid.');
        }

        this.client = new TeamSpeak({
            autoConnect: false,
            host,
            nickname,
            password,
            queryport: queryPort,
            serverport: serverPort,
            username,
        });

        this.client.on('debug', TeamSpeakBotController.debug);

        TeamSpeakBotController.debug('TS3 bot created.');
    }

    public async start(): Promise<TeamspeakService> {
        TeamSpeakBotController.debug('Start');
        return new TeamspeakService(this.client);
    }

    public async stop(): Promise<void> {
        TeamSpeakBotController.debug('Stop');
        this.client.forceQuit();
    }
}
