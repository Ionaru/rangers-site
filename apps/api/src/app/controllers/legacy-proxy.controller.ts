import { RequestHandler } from '@ionaru/micro-web-service';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { debug } from '../../debug';

export class LegacyProxyController {

    private static readonly debug = debug.extend('LegacyProxyController');

    private readonly proxy: RequestHandler;

    public constructor() {
        LegacyProxyController.debug('Start');

        const target = process.env.RANGERS_API_LEGACY_URL;

        if (!target) {
            throw new Error('Legacy Proxy configuration error!');
        }

        LegacyProxyController.debug('Configuration OK');

        this.proxy = createProxyMiddleware({target});

        LegacyProxyController.debug('Ready');
    }

    public init(): RequestHandler {
        LegacyProxyController.debug('Init');
        return this.proxy;
    }
}
