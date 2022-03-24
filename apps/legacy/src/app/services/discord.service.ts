import { IService } from '@rangers-site/interfaces';
import { Client, GuildMember, User, WebSocketManager } from 'discord.js';
import * as guessDate from 'guessdate-en';
import * as moment from 'moment-timezone';
import { InteractionHandler } from 'slash-create';

import { debug } from '../../debug';

export class DiscordService implements IService {

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static readonly LOAChannel = '323442871829004300';
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static readonly RangersGuild = '305471712546390017';
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static readonly LoAFormat = 'dddd, MMMM Do YYYY';
    private static readonly debug = debug.extend('DiscordService');

    public constructor(
        private readonly client: Client,
    ) { }

    public static getLoaDate(text: string) {

        if (text === '') {
            return moment()
                .tz('Europe/Berlin');
        }

        return moment(guessDate(text))
            .tz('Europe/Berlin')
            .hours(5)
            .minute(0)
            .second(0)
            .millisecond(0);
    }

    public getCommandHandler(): (handler: InteractionHandler) => WebSocketManager {
        return (handler: InteractionHandler) => this.client.ws.on('INTERACTION_CREATE' as any, handler);
    }

    public async getNameFromId(id: string): Promise<string> {
        let member: GuildMember | User;
        try {
            const guild = await this.client.guilds.fetch(DiscordService.RangersGuild);
            member = await guild.members.fetch(id);
        } catch {
            member = await this.client.users.fetch(id);
        }
        const name = member instanceof GuildMember ? member.nickname || member.user.username : member.username;
        DiscordService.debug(`Resolved id ${id} to name ${name}`);
        return name;
    }
}
