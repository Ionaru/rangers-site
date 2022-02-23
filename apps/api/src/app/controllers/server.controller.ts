import { bodyParser, compression, IRoute, RequestLogger, ServiceController } from '@ionaru/micro-web-service';
import * as cors from 'cors';
import * as es from 'express-session';

import { debug } from '../../debug';

export class ServerController {

    private static readonly debug = debug.extend('ServerController');

    private readonly serviceController: ServiceController;

    public constructor(routes: IRoute[]) {
        ServerController.debug('Start');

        const port = Number(process.env.RANGERS_API_PORT) || 3000;

        if (
            isNaN(port) ||
            !process.env.RANGERS_API_SESSION_SECURE ||
            !process.env.RANGERS_API_SESSION_KEY ||
            !process.env.RANGERS_API_SESSION_SECRET
        ) {
            throw new Error('Server configuration error!');
        }

        ServerController.debug('Configuration OK');

        const secureCookies = process.env.RANGERS_API_SESSION_SECURE.toLowerCase() === 'true';
        const sessionParser = es({
            cookie: {
                httpOnly: true,
                maxAge: 6 * 60 * 60 * 1000, // 6 hours
                secure: secureCookies,
            },
            name: process.env.RANGERS_API_SESSION_KEY,
            proxy: true,
            resave: false,
            rolling: true,
            saveUninitialized: true,
            secret: process.env.RANGERS_API_SESSION_SECRET,
            store: undefined, // TODO: Session store.
        });

        const logger = new RequestLogger(ServerController.debug);

        this.serviceController = new ServiceController({
            middleware: [
                logger.getLogger(),
                bodyParser.json(),
                bodyParser.urlencoded({ extended: true }),
                compression(),
                cors(),
                sessionParser,
            ],
            port,
            routes,
        });

        ServerController.debug('Ready');
    }

    public async init(): Promise<void> {
        ServerController.debug('Init');
        await this.serviceController.listen();
    }

    public async stop(): Promise<void> {
        ServerController.debug('Stop');
        await this.serviceController.close();
        ServerController.debug('Server closed');
    }
}
