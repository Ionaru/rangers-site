import { LOAModel } from '@rangers-site/entities';
import * as moment from 'moment-timezone';
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { DiscordService } from '../services/discord.service';

export class LOACancelCommand extends SlashCommand {

    private static readonly debug = debug.extend('LOACancelCommand');

    public constructor(
        creator: SlashCreator,
    ) {
        super(creator, {
            description: 'Cancel a requested leave of absence.',
            guildIDs: [DiscordService.RangersGuild],
            name: 'loa-cancel',
            options: [
                {
                    description: 'Date of the LOA cancellation',
                    name: 'date',
                    required: true,
                    type: CommandOptionType.STRING,
                },
            ],
        });
    }

    public async run(context: CommandContext): Promise<void> {
        LOACancelCommand.debug('Received');
        await context.defer(false);

        if (process.env.NODE_ENV === 'production' && context.channelID !== DiscordService.LOAChannel) {
            context.send('Please use the #leave_of_absence channel.').then();
            return;
        }

        const user = context.user.id;
        const loaMoment = DiscordService.getLoaDate(context.options.date);
        const date = loaMoment.toDate();
        const loaText = loaMoment.format(DiscordService.LoAFormat);

        if (loaMoment.weekday() !== 6) {
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
            await existingLoa.remove();
            context.send(`LOA for ${loaText} revoked.`).then();
        } else {
            context.send(`No LOA has been granted to you for ${loaText}.`).then();
        }
    }
}
