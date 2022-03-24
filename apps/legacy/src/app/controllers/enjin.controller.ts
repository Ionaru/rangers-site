import { IController } from '@rangers-site/interfaces';

import { EnjinService } from '../services/enjin.service';

export class EnjinController implements IController<EnjinService> {

    private readonly domain: string;
    private readonly apiKey: string;

    public constructor() {
        const domain = process.env.RANGERS_ENJIN_DOMAIN;
        const apiKey = process.env.RANGERS_ENJIN_KEY;

        if (!domain || !apiKey) {
            throw new Error('Enjin configuration error!');
        }

        this.domain = domain;
        this.apiKey = apiKey;
    }

    public async start(): Promise<EnjinService> {
        return new EnjinService(this.domain, this.apiKey);
    }

    public async stop(): Promise<void> {
        // Nothing to do here.
    }
}
