import { LOAModel, UserModel } from '@rangers-site/entities';
import * as moment from 'moment-timezone';
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { DiscordService } from '../services/discord.service';

export class LOACommand extends SlashCommand {

    private static readonly debug = debug.extend('LOACommand');

    public constructor(
        creator: SlashCreator,
        private readonly discordService: DiscordService,
    ) {
        super(creator, {
            description: 'Request a leave of absence.',
            guildIDs: [DiscordService.RangersGuild],
            name: 'loa',
            options: [
                {
                    description: 'Date of the LOA',
                    name: 'date',
                    required: true,
                    type: CommandOptionType.STRING,
                },
            ],
        });
    }

    public async run(context: CommandContext): Promise<void> {
        LOACommand.debug('Received');
        await context.defer(false);

        if (process.env.NODE_ENV === 'production' && context.channelID !== DiscordService.LOAChannel) {
            context.send('Request your LOA in the #leave_of_absence channel.').then();
            return;
        }

        const user = context.user.id;
        const loaMoment = DiscordService.getLoaDate(context.options.date);
        const date = loaMoment.toDate();
        const loaText = loaMoment.format(DiscordService.LoAFormat);

        if (loaMoment.weekday() !== 3 && loaMoment.weekday() !== 6) {
            context.send(`Invalid date, no operation: ${loaText}.`).then();
            return;
        }

        if (moment().isAfter(date, 'day')) {
            context.send(`Invalid date, in the past: ${loaText}.`).then();
            return;
        }

        const existingLoa = await LOAModel.doQuery()
            .where(`date = DATE_FORMAT(:date, "%Y-%m-%d")`, { date })
            .andWhere('user = :user', { user })
            .getOne();

        if (existingLoa) {
            context.send(`A LOA was already granted to you for ${loaText}.`).then();
        } else {
            await new LOAModel(date, user).save();

            const siteUser = await UserModel.doQuery()
                .where(`${UserModel.alias}.discordUser = :user`, { user })
                .getOne();

            if (!siteUser) {
                const name = await this.discordService.getNameFromId(user);
                await new UserModel(user, name).save();
            }

            context.send(`LOA for ${loaText} granted.`).then();
        }
    }
}
