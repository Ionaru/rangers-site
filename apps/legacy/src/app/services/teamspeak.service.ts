import { filterArray } from '@ionaru/array-utils';
import { BadgeModel, RankModel, RoleModel, UserModel } from '@rangers-site/entities';
import { IService } from '@rangers-site/interfaces';
import {
    ClientType,
    TeamSpeak,
    TeamSpeakClient,
    TeamSpeakServerGroup,
    TextMessageTargetMode,
} from 'ts3-nodejs-library/lib';

import { debug } from '../../debug';

export class TeamspeakService implements IService {

    private static readonly debug = debug.extend('TeamspeakService');

    private clientId?: number;

    public constructor(
        private readonly client: TeamSpeak,
    ) {
        this.connect();
    }

    public async getClients(): Promise<TeamSpeakClient[]> {
        await this.connect();
        TeamspeakService.debug(`clientlist`);
        return this.client.clientList({ clientType: ClientType.Regular });
    }

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
        return this.sendMessageToChannel(Number(process.env.RANGERS_TS_OPERATIONS_CHANNEL), msg);
    }

    public async applyBadgesToUser(user: UserModel) {
        await this.connect();

        const userId = user.ts3User?.uid;

        if (!userId) {
            throw new Error(`User (${user.id}, ${userId}) has no TS ID!`);
        }

        const client = await this.getClient(userId);
        if (!client) {
            return;
        }

        const allTsBadges = await BadgeModel.getTeamspeakGroups();
        const badgesToAssign = filterArray(user.badges.map((badge) => badge.teamspeakRank?.id.toString()));
        const badgesToRemove = client.servergroups
            .filter((sgid) => !badgesToAssign.includes(sgid))
            .filter((sgid) => allTsBadges.includes(sgid));

        for (const badgeToRemove of badgesToRemove) {
            TeamspeakService.debug(`serverGroupDelClient -> ${userId} (${badgeToRemove})`);
            await this.client.serverGroupDelClient(client.databaseId, badgeToRemove);
        }

        for (const badgeToAssign of badgesToAssign) {
            if (!client.servergroups.includes(badgeToAssign)) {
                TeamspeakService.debug(`serverGroupAddClient -> ${userId} (${badgeToAssign})`);
                this.client.serverGroupAddClient(client.databaseId, badgeToAssign);
            }
        }
    }

    public async applyRolesToUser(user: UserModel) {
        await this.connect();

        const userId = user.ts3User?.uid;

        if (!userId) {
            throw new Error(`User (${user.id}, ${userId}) has no TS ID!`);
        }

        const client = await this.getClient(userId);
        if (!client) {
            return;
        }

        const allTsRoles = await RoleModel.getTeamspeakGroups();
        const rolesToAssign = filterArray(user.roles.map((role) => role.teamspeakRank?.id.toString()));
        const rolesToRemove = client.servergroups
            .filter((sgid) => !rolesToAssign.includes(sgid))
            .filter((sgid) => allTsRoles.includes(sgid));

        for (const roleToRemove of rolesToRemove) {
            TeamspeakService.debug(`serverGroupDelClient -> ${userId} (${roleToRemove})`);
            await this.client.serverGroupDelClient(client.databaseId, roleToRemove);
        }

        for (const roleToAssign of rolesToAssign) {
            if (!client.servergroups.includes(roleToAssign)) {
                TeamspeakService.debug(`serverGroupAddClient -> ${userId} (${roleToAssign})`);
                this.client.serverGroupAddClient(client.databaseId, roleToAssign);
            }
        }
    }

    public async applyRankToUser(user: UserModel): Promise<void> {
        await this.connect();

        const rankId = user.rank?.teamspeakRank?.id;
        const userId = user.ts3User?.uid;

        if ((user.rank && !rankId) || !userId) {
            throw new Error(`Rank (${user.rank?.id}, ${rankId}) or user (${user.id}, ${userId}) has no TS ID!`);
        }

        const client = await this.getClient(userId);
        if (!client) {
            return;
        }

        if (rankId) {
            if (client.servergroups.includes(rankId.toString())) {
                return;
            }

            await this.removeRanksFromUser(user);
            TeamspeakService.debug(`serverGroupAddClient -> ${userId} (${rankId})`);
            await this.client.serverGroupAddClient(client.databaseId, rankId.toString());
        } else {
            await this.removeRanksFromUser(user);
        }
    }

    public async removeRanksFromUser(user: UserModel): Promise<void> {
        await this.connect();

        const userId = user.ts3User?.uid;
        if (!userId) {
            throw new Error('User has no TS ID!');
        }

        const client = await this.getClient(userId);
        if (!client) {
            return;
        }

        const tsRanks = await RankModel.getTeamspeakGroups();
        const clientRanks = client.servergroups.filter((sgid) => tsRanks.includes(sgid));

        if (!clientRanks.length) {
            return;
        }

        for (const clientRank of clientRanks) {
            TeamspeakService.debug(`serverGroupDelClient -> ${userId} (${clientRank})`);
            await this.client.serverGroupDelClient(client.databaseId, clientRank);
        }
    }

    public async syncUser(user: UserModel): Promise<void> {
        await this.applyBadgesToUser(user);
        await this.applyRolesToUser(user);
        await this.applyRankToUser(user);
    }

    public async syncClient(client: TeamSpeakClient) {
        const user = await UserModel.findOne({
            relations: ['ts3User', 'rank', 'roles', 'badges'],
            where: { ts3User: { uid: client.uniqueIdentifier } },
        });

        if (!user) {
            // Unknown user, ignore
            return;
        }

        this.syncUser(user);
    }

    public async getClient(uid: string): Promise<TeamSpeakClient | undefined> {
        await this.connect();

        TeamspeakService.debug(`getClientByUid -> ${uid}`);
        const client = await this.client.getClientByUid(uid);
        if (!client) {
            process.emitWarning(`User ${uid} has no DB entry in Teamspeak (should log in at least once)!`);
            return;
        }

        return client;
    }

    private async connect() {
        if (this.clientId) {
            return;
        }

        this.client.once('close', (e?: string) => {
            process.emitWarning(`Connection closed, reason: ${e}`);
            delete this.clientId;
            this.connect();
        });

        this.client.on('clientconnect', (client) => {
            // User connects to TS.
            TeamspeakService.debug(`clientconnect -> ${client.client.uniqueIdentifier}`);
            this.syncClient(client.client);
        });

        TeamspeakService.debug('Connecting to TS3...');

        await this.client.connect();
        TeamspeakService.debug('Asking the real questions... (whoami)');
        const me = await this.client.whoami();

        TeamspeakService.debug(`Logged in as ${me.clientNickname} (${me.clientId})`);

        this.clientId = Number(me.clientId);
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
