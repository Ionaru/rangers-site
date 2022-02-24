import { RoleModel, UserModel } from '@rangers-site/entities';
import { CronJob } from 'cron';
import { In, IsNull, Not } from 'typeorm';

import { debug } from '../../debug';
import { EnjinService } from '../services/enjin.service';
import { TeamspeakService } from '../services/teamspeak.service';

export class SyncRolesTask {
    private static readonly debug = debug.extend('SyncRanksTask');
    private readonly syncJob: CronJob;

    public constructor(
        private readonly teamspeak: TeamspeakService,
        private readonly enjin: EnjinService,
    ) {
        this.syncJob = new CronJob({
            cronTime: '0 3-59/5 * * * *', // Every 5 minutes starting at minute 3
            onTick: () => this.tick(),
            runOnInit: false,
            timeZone: 'Europe/Berlin',
        });
    }

    public start(): void {
        if (process.env.RANGERS_TASK_SYNC_ROLES?.toLowerCase() === 'true') {
            SyncRolesTask.debug('Start');
            this.syncJob.start();
        }
    }

    private async tick(): Promise<void> {
        SyncRolesTask.debug('Tick');

        const roleEnjinTags = await RoleModel.getEnjinTags();
        const users = await this.enjin.getUsersWithTags(...roleEnjinTags);

        for (const [enjinId, user] of Object.entries(users)) {
            SyncRolesTask.debug(`Checking user ${enjinId} (name: ${user.username})`);
            const userTags = await this.enjin.getUserTags(enjinId);

            // Find the correct roles in the enjin tags.
            const roles = await RoleModel.find({
                relations: ['enjinTag', 'teamspeakRank'],
                where: { enjinTag: { id: In([...userTags.map((t) => t.tag_id)]) } },
            });

            const existingUser = await UserModel.findOne({
                relations: ['ts3User', 'roles'],
                where: { enjinUser: enjinId, ts3User: Not(IsNull()) },
            });
            if (existingUser) {
                SyncRolesTask.debug(`Updating user ${existingUser.id} (name: ${existingUser.name})`);
                existingUser.roles = roles;
                existingUser.save();

                await this.teamspeak.applyRolesToUser(existingUser);
            }
        }

        SyncRolesTask.debug('Done!');
    }
}
