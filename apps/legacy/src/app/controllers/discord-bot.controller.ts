import { Client } from 'discord.js';

import { debug } from '../../debug';
import { DiscordService } from '../services/discord.service';

export class DiscordBotController {

    private static readonly debug = debug.extend('DiscordBotController');

    private readonly client: Client;

    public constructor() {
        const token = process.env.RANGERS_DISCORD_TOKEN;

        if (!token) {
            throw new Error('Discord configuration error! Token missing.');
        }

        this.client = new Client();
        this.client.token = token;

        DiscordBotController.debug('Discord bot created.');
    }

    public async connect(): Promise<DiscordService> {

        DiscordBotController.debug('Connecting to Discord...');

        await this.client.login();

        DiscordBotController.debug(`Logged in as ${this.client.user?.tag}`);

        this.client.once('error', (e) => {
            process.emitWarning(`Connection closed, reason: ${e}`);
            this.connect().then();
        });

        return new DiscordService(this.client);
    }

    public async disconnect(): Promise<void> {
        DiscordBotController.debug('Logging out');
        await this.client.destroy();
        DiscordBotController.debug('Connection terminated');
    }
}
