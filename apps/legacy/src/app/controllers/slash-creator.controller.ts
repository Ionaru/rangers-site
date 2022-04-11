import { IController } from '@rangers-site/interfaces';
import { GatewayServer, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { DiscordService } from '../services/discord.service';
import { SlashCreatorService } from '../services/slash-creator.service';

export class SlashCreatorController implements IController<SlashCreatorService, [DiscordService]> {

    private static readonly debug = debug.extend('SlashCreatorController');

    private readonly creator: SlashCreator;

    public constructor() {
        SlashCreatorController.debug('Start');

        const applicationID = process.env.RANGERS_DISCORD_CLIENT_ID;
        const publicKey = process.env.RANGERS_DISCORD_CLIENT_SECRET;
        const token = process.env.RANGERS_DISCORD_TOKEN;

        if (!applicationID || !publicKey || !token) {
            throw new Error('SlashCreator configuration error!');
        }

        SlashCreatorController.debug('Configuration OK');

        this.creator = new SlashCreator({applicationID, publicKey, token});
        this.creator.on('commandError', (_, e) => {
            throw e;
        });
        this.creator.on('error', (e) => {
            throw e;
        });

        SlashCreatorController.debug('Ready');
    }

    public async start(...[discordService]: [DiscordService]): Promise<SlashCreatorService> {
        SlashCreatorController.debug('Start');
        this.creator.withServer(new GatewayServer(discordService.getCommandHandler()));
        return new SlashCreatorService(this.creator);
    }

    public async stop(): Promise<void> {
        SlashCreatorController.debug('Stop');
    }
}
