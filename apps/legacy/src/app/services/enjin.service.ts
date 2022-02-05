import { generateRandomString } from '@ionaru/random-string';
import * as axios from 'axios';

import { debug } from '../../debug';
import { IEnjinRequest, IEnjinRequestParams, IResponse, ITagType, ITagTypes } from '../typings/enjin.d';

export class EnjinService {
    private static readonly debug = debug.extend('EnjinService');

    public constructor(
        private readonly domain: string,
        private readonly apiKey: string,
    ) {
    }

    public async getTags(): Promise<ITagTypes | undefined> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this.doRequest('Tags.getTagTypes', { api_key: this.apiKey });
    }

    public async getTag(id: string): Promise<ITagType | undefined> {
        const tags = await this.getTags();
        if (!tags) {
            return;
        }

        return tags[id];
    }

    private async doRequest<T>(method: string, params: IEnjinRequestParams): Promise<T> {
        const url = `https://${this.domain}/api/v1/api.php`;
        const id = generateRandomString(10);
        const body: IEnjinRequest = {
            id,
            jsonrpc: '2.0',
            method,
            params,
        };

        EnjinService.debug(`${id}: ${url} (${body.method})`);
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
