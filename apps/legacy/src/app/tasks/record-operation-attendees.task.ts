import { AttendanceModel, OperationModel, TeamspeakUserModel } from '@rangers-site/entities';
import { CronJob } from 'cron';

import { debug } from '../../debug';
import { DatabaseService } from '../services/database.service';
import { TeamspeakService } from '../services/teamspeak.service';

export class RecordOperationAttendeesTask {
    private static readonly debug = debug.extend('RecordOperationAttendeesTask');
    private readonly wednesdayJob: CronJob;
    private readonly saturdayJob: CronJob;

    public constructor(
        private readonly teamspeak: TeamspeakService,
        private readonly db: DatabaseService,
    ) {
        this.wednesdayJob = new CronJob({
            // Wednesday 19:00
            cronTime: '0 0 19 * * 3',
            onTick: () => this.tick(),
            timeZone: 'Europe/Berlin',
        });
        this.saturdayJob = new CronJob({
            // Saturday 20:00
            cronTime: '0 0 20 * * 6',
            onTick: () => this.tick(),
            timeZone: 'Europe/Berlin',
        });
    }

    public start(): void {
        RecordOperationAttendeesTask.debug('Start');
        this.wednesdayJob.start();
        this.saturdayJob.start();
    }

    private async tick(): Promise<void> {
        RecordOperationAttendeesTask.debug('Tick');
        this.teamspeak.sendMessageToOperationsChannel('Good luck, rangers! o7').then();

        const operation = new OperationModel();
        await operation.save();

        // 20 * 15 minutes = 5 hours.
        const checkPeriods = 20;
        for (let i = 0; i < checkPeriods; i++) {

            // Schedule checks.
            setTimeout(async () => {
                RecordOperationAttendeesTask.debug('Checking people...');
                await this.checkAttendance(operation);
            }, 900_000 * i);
        }
        RecordOperationAttendeesTask.debug('Done!');
    }

    private async checkAttendance(operation: OperationModel): Promise<void> {

        const clients = await this.teamspeak.getClientsInChannel(Number(process.env.RANGERS_TS_OPERATIONS_CHANNEL));

        RecordOperationAttendeesTask.debug(`${clients.length} people currently here!`);

        const attendees: AttendanceModel[] = [];

        for (const client of clients) {
            let tsClient = await TeamspeakUserModel.doQuery().where({ uid: client.uniqueIdentifier }).getOne();
            if (!tsClient) {
                tsClient = new TeamspeakUserModel(client.uniqueIdentifier, client.nickname);
                await tsClient.save();
            }
            attendees.push(new AttendanceModel(new Date(), operation, tsClient));
        }

        await this.db.save(attendees);
    }
}
