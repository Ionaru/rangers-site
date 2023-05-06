import { UserModel } from '@rangers-site/entities';
import { IService } from '@rangers-site/interfaces';
import { Client, GuildMember, Role, User, WebSocketManager } from 'discord.js';
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

        const guessTimezone = 'Europe/Berlin';

        if (text === '') {
            return moment()
                .tz(guessTimezone);
        }

        for (const character of ['.', '-', '/']) {
            if (text.includes(character)) {
                const textParts = text.split(character);

                if (textParts.length <= 1 || textParts.length > 3) {
                    break;
                }

                textParts.reverse();
                textParts.forEach((part, index) => textParts[index] = part.padStart(2, '0'));

                // Fix year input.
                if (textParts.length === 2) {
                    textParts.unshift('2022');
                } else if (textParts[0].length === 2) {
                    textParts[0] = '20' + textParts[0];
                }

                text = textParts.join('-');
                return moment(text)
                    .tz(guessTimezone)
                    .hours(5)
                    .minute(0)
                    .second(0)
                    .millisecond(0);
            }
        }

        return moment(guessDate(text))
            .tz(guessTimezone)
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

    public async getUsersInServer(): Promise<GuildMember[]> {
        const guild = await this.client.guilds.fetch(DiscordService.RangersGuild);
        const members = await guild.members.fetch();
        return [...members.values()];
    }

    public async getRolesInServer(): Promise<Role[]> {
        const guild = await this.client.guilds.fetch(DiscordService.RangersGuild);
        const roles = await guild.roles.fetch();
        return [...roles.values()];
    }

    public async getRoleFromId(id: string): Promise<Role | null> {
        const guild = await this.client.guilds.fetch(DiscordService.RangersGuild);
        return guild.roles.fetch(id);
    }

    public async syncUser(user: UserModel) {

        const userId = user.discordUser;

        if (!userId) {
            throw new Error(`User (${user.id}, ${userId}) has no Discord ID!`);
        }

        const guild = await this.client.guilds.fetch(DiscordService.RangersGuild);
        const member = await guild.members.fetch(userId);

        const roles = user.roles.map((role) => role.discordRole).filter((role): role is string => !!role);
        const discordRoles = await this.getRolesInServer();
        const rolesToGive = discordRoles.filter((role) => roles.includes(role.id));
        await member.roles.add(rolesToGive);
    }
}
