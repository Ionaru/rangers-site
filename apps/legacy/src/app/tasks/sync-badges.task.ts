import { BadgeModel, UserModel } from '@rangers-site/entities';
import { CronJob } from 'cron';
import { In, IsNull, Not } from 'typeorm';

import { debug } from '../../debug';
import { EnjinService } from '../services/enjin.service';
import { TeamspeakService } from '../services/teamspeak.service';

export class SyncBadgesTask {
    private static readonly debug = debug.extend('SyncBadgesTask');
    private readonly syncJob: CronJob;

    public constructor(
        private readonly teamspeak: TeamspeakService,
        private readonly enjin: EnjinService,
    ) {
        this.syncJob = new CronJob({
            cronTime: '0 0/15 * * * *', // Every 15 minutes starting at minute 0
            onTick: () => this.tick(),
            runOnInit: false,
            timeZone: 'Europe/Berlin',
        });
    }

    public start(): void {
        if (process.env.RANGERS_TASK_SYNC_BADGES?.toLowerCase() === 'true') {
            SyncBadgesTask.debug('Start');
            this.syncJob.start();
        }
    }

    private async tick(): Promise<void> {
        SyncBadgesTask.debug('Tick');

        const badgeEnjinTags = await BadgeModel.getEnjinTags();
        const users = await this.enjin.getUsersWithTags(...badgeEnjinTags);

        for (const [enjinId, user] of Object.entries(users)) {
            SyncBadgesTask.debug(`Checking user ${enjinId} (name: ${user.username})`);
            const userTags = await this.enjin.getUserTags(enjinId);

            // Find the correct badges in the enjin tags.
            const badges = await BadgeModel.find({
                relations: ['enjinTag', 'teamspeakRank'],
                where: { enjinTag: { id: In([...userTags.map((t) => t.tag_id)]) } },
            });

            const existingUser = await UserModel.findOne({
                relations: ['ts3User', 'badges'],
                where: { enjinUser: enjinId, ts3User: Not(IsNull()) },
            });
            if (existingUser) {
                SyncBadgesTask.debug(`Updating user ${existingUser.id} (name: ${existingUser.name})`);
                existingUser.badges = badges;
                existingUser.save();

                await this.teamspeak.applyBadgesToUser(existingUser);
            }
        }

        SyncBadgesTask.debug('Done!');
    }
}
