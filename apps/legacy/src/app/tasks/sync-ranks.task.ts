import { RankModel, UserModel } from '@rangers-site/entities';
import { CronJob } from 'cron';
import { In, IsNull, Not } from 'typeorm';

import { debug } from '../../debug';
import { EnjinService } from '../services/enjin.service';
import { TeamspeakService } from '../services/teamspeak.service';

export class SyncRanksTask {
    private static readonly debug = debug.extend('SyncRanksTask');
    private readonly syncJob: CronJob;

    public constructor(
        private readonly teamspeak: TeamspeakService,
        private readonly enjin: EnjinService,
    ) {
        this.syncJob = new CronJob({
            cronTime: '0 5/15 * * * *', // Every 15 minutes starting at minute 5
            onTick: () => this.tick(),
            runOnInit: false,
            timeZone: 'Europe/Berlin',
        });
    }

    public start(): void {
        if (process.env.RANGERS_TASK_SYNC_RANKS?.toLowerCase() === 'true') {
            SyncRanksTask.debug('Start');
            this.syncJob.start();
        }
    }

    private async tick(): Promise<void> {
        SyncRanksTask.debug('Tick');

        const rankEnjinTags = await RankModel.getEnjinTags();
        const users = await this.enjin.getUsersWithTags(...rankEnjinTags);

        for (const [enjinId, user] of Object.entries(users)) {
            SyncRanksTask.debug(`Checking user ${enjinId} (name: ${user.username})`);
            const userTags = await this.enjin.getUserTags(enjinId);

            // Find the correct rank in the enjin tags.
            const rank = await RankModel.findOne({
                relations: ['enjinTag', 'teamspeakRank'],
                where: { enjinTag: { id: In([...userTags.map((t) => t.tag_id)]) } },
            }) || null;

            const existingUser = await UserModel.findOne({
                relations: ['ts3User', 'rank'],
                where: { enjinUser: enjinId, ts3User: Not(IsNull()) },
            });
            if (existingUser) {
                SyncRanksTask.debug(`Updating user ${existingUser.id} (name: ${existingUser.name})`);
                existingUser.rank = rank;
                existingUser.save();

                await this.teamspeak.applyRankToUser(existingUser);
            }
        }

        SyncRanksTask.debug('Done!');
    }
}
