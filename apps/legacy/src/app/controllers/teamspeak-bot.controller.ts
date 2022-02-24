// tslint:disable-next-line:no-submodule-imports
import { TeamSpeak } from 'ts3-nodejs-library/lib';

import { debug } from '../../debug';
import { TeamspeakService } from '../services/teamspeak.service';

export class TeamSpeakBotController {

    private static readonly debug = debug.extend('TeamSpeakBotController');

    private readonly client: TeamSpeak;

    public constructor() {
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

        if (process.env.NODE_ENV !== 'production') {
            this.client.on('debug', TeamSpeakBotController.debug);
        }

        TeamSpeakBotController.debug('TS3 bot created.');
    }

    public async connect(): Promise<TeamspeakService> {
        return new TeamspeakService(this.client);
    }

    public async disconnect(): Promise<void> {
        try {
            await this.client.logout();
            await this.client.quit();
        } catch {
            process.emitWarning('logout() or quit() failed, assuming logged out.');
        }
    }
}
