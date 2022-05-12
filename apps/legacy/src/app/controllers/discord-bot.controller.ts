import { IController } from '@rangers-site/interfaces';
import { Client, Intents } from 'discord.js';

import { debug } from '../../debug';
import { DiscordService } from '../services/discord.service';

export class DiscordBotController implements IController<DiscordService> {

    private static readonly debug = debug.extend('DiscordBotController');

    private readonly client: Client;

    public constructor() {
        const token = process.env.RANGERS_DISCORD_TOKEN;

        if (!token) {
            throw new Error('Discord configuration error! Token missing.');
        }

        this.client = new Client({intents: [Intents.FLAGS.GUILD_MEMBERS]});
        this.client.token = token;

        DiscordBotController.debug('Discord bot created.');
    }

    public async start(): Promise<DiscordService> {

        DiscordBotController.debug('Connecting to Discord...');

        await this.client.login();

        DiscordBotController.debug(`Logged in as ${this.client.user?.tag}`);

        this.client.once('error', (e) => {
            process.emitWarning(`Connection closed, reason: ${e}`);
            this.start().then();
        });

        return new DiscordService(this.client);
    }

    public async stop(): Promise<void> {
        DiscordBotController.debug('Logging out');
        this.client.destroy();
        DiscordBotController.debug('Connection terminated');
    }
}
