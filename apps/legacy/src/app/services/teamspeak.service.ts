import {
    ClientType,
    TeamSpeak,
    TeamSpeakClient,
    TeamSpeakServerGroup,
    TextMessageTargetMode,
} from 'ts3-nodejs-library/lib';

import { debug } from '../../debug';

export class TeamspeakService {

    public static readonly operationsChannel = 67256;
    public static readonly workingChannel = 35522;
    private static readonly debug = debug.extend('TeamspeakService');

    private clientId?: number;
    private disconnectTimer?: NodeJS.Timeout;

    public constructor(
        private readonly client: TeamSpeak,
    ) { }

    public async getClientsInChannel(cid: number): Promise<TeamSpeakClient[]> {
        await this.connect();
        TeamspeakService.debug(`clientlist -> ${cid}`);
        return this.client.clientList({ cid: cid.toString(), clientType: ClientType.Regular });
    }

    public async getRanks(): Promise<TeamSpeakServerGroup[]> {
        await this.connect();
        TeamspeakService.debug(`servergrouplist`);
        return this.client.serverGroupList({ type: 1 });
    }

    public async getRank(sgid: number): Promise<TeamSpeakServerGroup | undefined> {
        await this.connect();
        TeamspeakService.debug(`servergroup`);
        return this.client.getServerGroupById(sgid.toString());
    }

    public async sendMessageToOperationsChannel(msg: string): Promise<void> {
        await this.connect();
        return this.sendMessageToChannel(TeamspeakService.operationsChannel, msg);
    }

    public async sendMessageToWorkingChannel(msg: string): Promise<void> {
        await this.connect();
        return this.sendMessageToChannel(TeamspeakService.workingChannel, msg);
    }

    // public async applyRankToUsers(rank: RankModel | RoleModel | BadgeModel, users: UserModel[]) {
    //
    // }

    private async connect() {
        if (this.clientId && this.disconnectTimer) {
            this.disconnectTimer.refresh();
            return;
        }

        TeamspeakService.debug('Connecting to TS3...');

        await this.client.connect();
        const me = await this.client.whoami();

        this.client.once('close', (e?: string) => {
            process.emitWarning(`Connection closed, reason: ${e}`);
        });

        TeamspeakService.debug(`Logged in as ${me.clientNickname} (${me.clientId})`);

        this.clientId = Number(me.clientId);
        this.disconnectTimer = setTimeout(() => this.disconnect(), 30000);
    }

    private async disconnect() {
        if (!this.clientId) {
            return;
        }

        TeamspeakService.debug('Logging out');

        try {
            await this.client.logout();
            await this.client.quit();
        } catch {
            process.emitWarning('logout() or quit() failed, assuming logged out.');
        }

        TeamspeakService.debug('Connection terminated');

        this.clientId = undefined;
        this.disconnectTimer = undefined;
    }

    private async sendMessageToChannel(cid: number, msg: string) {
        await this.connect();

        await this.moveToChannel(cid);

        TeamspeakService.debug(`sendtextmessage -> ${cid} (${msg})`);
        await this.client.sendTextMessage(
            cid.toString(),
            TextMessageTargetMode.CHANNEL,
            msg,
        );
    }

    private async moveToChannel(cid: number) {
        await this.connect();

        if (!this.clientId) {
            throw new Error('No client!');
        }

        TeamspeakService.debug(`clientmove -> ${cid}`);
        await this.client.clientMove(this.clientId.toString(), cid.toString());
    }
}
