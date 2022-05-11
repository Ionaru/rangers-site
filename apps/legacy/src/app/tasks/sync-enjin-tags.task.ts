import { EnjinTagModel } from '@rangers-site/entities';
import { CronJob } from 'cron';
import { In, Not } from 'typeorm';

import { debug } from '../../debug';
import { EnjinService } from '../services/enjin.service';

export class SyncEnjinTagsTask {
    private static readonly debug = debug.extend('SyncEnjinTagsTask');
    private readonly syncJob: CronJob;

    public constructor(
        private readonly enjin: EnjinService,
    ) {
        this.syncJob = new CronJob({
            cronTime: '0 0 * * * *',
            onTick: () => this.tick(),
            runOnInit: false,
            timeZone: 'Europe/Berlin',
        });
    }

    public start(): void {
        if (process.env.RANGERS_TASK_SYNC_ENJIN_TAGS?.toLowerCase() === 'true') {
            SyncEnjinTagsTask.debug('Start');
            this.syncJob.start();
        }
    }

    private async tick(): Promise<void> {
        SyncEnjinTagsTask.debug('Tick');

        const tags = await this.enjin.getTags();
        const tagList = Object.keys(tags);
        const existingTags = (await EnjinTagModel.find({
            where: { id: In(tagList) },
        })).map((t) => t.id);

        const missingTags = tagList.filter((tag) => !existingTags.includes(tag));
        for (const missingTag of missingTags) {
            const enjinTag = new EnjinTagModel(missingTag, tags[missingTag].tagname);
            await enjinTag.save();
        }

        const removedTags = await EnjinTagModel.find({
            where: { id: Not(In(tagList)) },
        });
        for (const removedTag of removedTags) {
            await removedTag.remove();
        }

        SyncEnjinTagsTask.debug('Done!');
    }
}
