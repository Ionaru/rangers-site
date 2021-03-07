import { EnjinService } from '../services/enjin.service';

export class EnjinController {

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

    public connect(): EnjinService {
        return new EnjinService(this.domain, this.apiKey);
    }
}
