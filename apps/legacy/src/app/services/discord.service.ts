import { LOAModel, UserModel } from '@rangers-site/entities';
import { Client, GuildMember, Message, User } from 'discord.js';
import * as guessDate from 'guessdate-en';
import * as moment from 'moment-timezone';

import { debug } from '../../debug';

export class DiscordService {

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static readonly LOAChannel = '323442871829004300';
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static readonly RangersGuild = '305471712546390017';
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static readonly LoAFormat = 'dddd, MMMM Do YYYY';
    private static readonly debug = debug.extend('DiscordService');

    public constructor(private readonly client: Client) {
        this.client.on('message', this.onMessage.bind(this));
    }

    private static getLoaDate(text: string) {

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

    private async onMessage(msg: Message) {

        if (!msg.content.startsWith('!')) {
            return;
        }

        DiscordService.debug(msg.content);
        const message = msg.content.trim().toLowerCase().substr(1);
        const user = msg.author.id;

        if (message.startsWith('loa')) {
            this.processLoaMessage(msg, message, user).then().catch((error: Error) => {
                const time = Date.now();
                process.stderr.write(`Caught error @ ${time} \n${error}\n`);
                process.stderr.write(`Error triggered by command: \n${msg.content}\n`);
                msg.reply(`:fire: Error: \`${error.message} @ ${time}\` :fire:`);
                throw error;
            });
        }
    }

    private async processLoaMessage(msg: Message, message: string, user: string) {

        if (process.env.NODE_ENV === 'production' && msg.channel.id !== DiscordService.LOAChannel) {
            msg.reply('Request your LOA in the #leave_of_absence channel.').then();
            return;
        }

        let loaMessage = message.replace('loa', '').trim();
        let cancel = false;

        if (loaMessage.startsWith('cancel')) {
            loaMessage = loaMessage.replace('cancel', '').trim();
            cancel = true;
        }

        const loaMoment = DiscordService.getLoaDate(loaMessage);
        const date = loaMoment.toDate();
        const loaText = loaMoment.format(DiscordService.LoAFormat);

        if (loaMoment.weekday() !== 3 && loaMoment.weekday() !== 6) {
            msg.reply(`Invalid date, no operation: ${loaText}.`).then();
            return;
        }

        if (moment().isAfter(date, 'day')) {
            msg.reply(`Invalid date, in the past: ${loaText}.`).then();
            return;
        }

        const existingLoa = await LOAModel.doQuery()
            .where(`date = DATE_FORMAT(:date, "%Y-%m-%d")`, { date })
            .andWhere('user = :user', { user })
            .getOne();

        if (existingLoa && !cancel) {
            msg.reply(`A LOA was already granted to you for ${loaText}.`).then();
        } else if (existingLoa) {
            await existingLoa.remove();
            msg.reply(`LOA for ${loaText} revoked.`).then();
        } else if (cancel) {
            msg.reply(`No LOA has been granted to you for ${loaText}.`).then();
        } else {
            await new LOAModel(date, user).save();

            const siteUser = await UserModel.doQuery()
                .where(`${UserModel.alias}.discordUser = :user`, { user })
                .getOne();

            if (!siteUser) {
                const name = await this.getNameFromId(user);
                await new UserModel(user, name).save();
            }

            msg.reply(`LOA for ${loaText} granted.`).then();
        }
    }
}
