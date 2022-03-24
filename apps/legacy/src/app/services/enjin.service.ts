import { splitArrayIntoChunks } from '@ionaru/array-utils';
import { generateRandomString } from '@ionaru/random-string';
import { RankModel } from '@rangers-site/entities';
import { IService } from '@rangers-site/interfaces';
import * as axios from 'axios';

import { debug } from '../../debug';
import { IEnjinRequest, IEnjinRequestParams, IResponse, ITagType, ITagTypes, IUsers, IUserTagInfo, IUserTags } from '../typings/enjin.d';

export class EnjinService implements IService {
    private static readonly debug = debug.extend('EnjinService');

    public constructor(
        private readonly domain: string,
        private readonly apiKey: string,
    ) {
    }

    public async getTags(): Promise<ITagTypes> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this.doRequest('Tags.getTagTypes');
    }

    public async getUsersWithTags(...tags: string[]): Promise<IUsers> {
        const result = await Promise.all(tags.map(
            // eslint-disable-next-line @typescript-eslint/naming-convention
            (tag_id) => this.doRequest<IUsers>('UserAdmin.get', { tag_id }),
        ));
        return result.reduce((acc, cur) => ({ ...acc, ...cur }), {});
    }

    public async getUserTags(userId: string): Promise<IUserTags> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this.doRequest<IUserTags>('UserAdmin.getUserTags', { user_id: userId });
    }

    public async getUsersTags(): Promise<IUserTagInfo> {
        const ranks = await RankModel.getEnjinTags();

        const users = await this.getUsersWithTags(...ranks);
        const userIds = Object.keys(users);

        let userTagInfoChunks: IUserTagInfo = {};
        const userIdsChunks = splitArrayIntoChunks(userIds, 2);

        for (const userIdsChunk of userIdsChunks) {
            const userTags = await Promise.all(userIdsChunk.map(
                (userId) => this.getUserTags(userId),
            ));
            userTagInfoChunks = Object.assign(userTagInfoChunks, userIdsChunk.map((userId, index) => ({
                [userId]: userTags[index],
            })).reduce((acc, cur) => ({ ...acc, ...cur }), {}));
        }

        return userTagInfoChunks;
    }

    public async getTag(id: string): Promise<ITagType | undefined> {
        const tags = await this.getTags();
        return tags[id];
    }

    private async doRequest<T>(method: string, params?: IEnjinRequestParams): Promise<T> {
        const url = `https://${this.domain}/api/v1/api.php`;
        const id = generateRandomString(10);
        const body: IEnjinRequest = {
            id,
            jsonrpc: '2.0',
            method,
            params: {api_key: this.apiKey, ...params},
        };

        EnjinService.debug(`${id}: ${url} (${body.method}, ${JSON.stringify(params)})`);
        const result = await axios.default.post<IResponse<T>>(url, body).catch((error: axios.AxiosError) => error);
        if (result instanceof Error) {
            throw result;
        }

        if ('error' in result.data) {
            throw new Error(`${result.data.error.code}: ${result.data.error.message}`);
        }

        if (result.data.id !== id) {
            throw new Error(`Request ID does not match! Expected ${id}, received ${result.data.id}.`);
        }

        return result.data.result;
    }
}
