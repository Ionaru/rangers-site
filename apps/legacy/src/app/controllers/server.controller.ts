import * as path from 'path';

import {
    bodyParser,
    compression,
    express,
    IOption,
    IRoute,
    RequestHandler,
    RequestLogger,
    ServiceController,
} from '@ionaru/micro-web-service';
import { IController } from '@rangers-site/interfaces';
import { TypeormStore } from 'connect-typeorm';
import * as fileUpload from 'express-fileupload';
import * as es from 'express-session';
import * as Handlebars from 'hbs';
import helmet, { contentSecurityPolicy } from 'helmet';
import * as passport from 'passport';

import { debug } from '../../debug';
import { DatabaseService } from '../services/database.service';
import { hasPermission, ifCond, json, keys, values } from '../utils/handlebars.util';

export class ServerController implements IController<void> {

    private static readonly debug = debug.extend('ServerController');

    private sourceFolder = 'src';
    private assetsFolder = path.join(__dirname, 'assets');
    private viewsFolder = path.join(__dirname, 'app', 'views');

    private serviceController?: ServiceController;

    public constructor(private readonly db: DatabaseService, private readonly routes: IRoute[]) { }

    public async start(): Promise<void> {
        ServerController.debug('Creating server...');

        const port = Number(process.env.RANGERS_PORT) || 3000;

        const repository = this.db.getSessionRepository();

        const cookieName = process.env.RANGERS_COOKIE_NAME;
        const cookieSecret = process.env.RANGERS_COOKIE_SECRET;

        if (!cookieName || !cookieSecret) {
            throw new Error('Both the cookie name and cookie secret must be provided!');
        }

        const logger = new RequestLogger(ServerController.debug);

        const middleware: RequestHandler[] = [
            es({
                cookie: {
                    httpOnly: true,
                    maxAge: 86400_000, // 24 hours
                    sameSite: 'lax',
                    secure: false,
                },
                name: cookieName,
                proxy: true,
                resave: false,
                rolling: true,
                saveUninitialized: false,
                secret: cookieSecret,
                store: new TypeormStore({ cleanupLimit: 10, limitSubquery: false }).connect(repository),
            }),
            logger.getLogger(),
            bodyParser.urlencoded({ extended: true }),
            compression(),
            fileUpload({ limits: { fileSize: 5242880 } }), // 5MB
            passport.initialize(),
            passport.session(),
            helmet({ crossOriginEmbedderPolicy: false }),
            contentSecurityPolicy({
                directives: {
                    ...contentSecurityPolicy.getDefaultDirectives(),
                    'frame-src': ['\'self\'', 'https://youtube.com/embed/', 'https://www.youtube.com/embed/'],
                    'script-src': ['\'self\'', '\'unsafe-inline\''],
                },
            }),
        ];

        const options: IOption[] = [
            ['view engine', Handlebars],
            ['views', this.viewsFolder],
        ];

        Handlebars.registerPartials(path.join(this.viewsFolder, 'partials'));

        Handlebars.registerHelper('json', json);
        Handlebars.registerHelper('keys', keys);
        Handlebars.registerHelper('values', values);
        Handlebars.registerHelper('ifCond', ifCond);
        Handlebars.registerHelper('hasPermission', hasPermission);

        // Make sure static assets are served before the passport session handler is initialized.
        middleware.unshift(express.static(this.assetsFolder));

        if (process.env.NODE_ENV !== 'production') {
            // Serve sources when not in production mode.
            middleware.unshift(express.static(this.sourceFolder));
        }

        this.serviceController = new ServiceController({
            middleware,
            options,
            port,
            routes: this.routes,
        });
        ServerController.debug('Server constructed');
        await this.serviceController.listen();
        ServerController.debug(`Server listening on port ${port}`);
    }

    public async stop(): Promise<void> {
        ServerController.debug('Stopping server...');
        if (this.serviceController) {
            await this.serviceController.close();
        }
        ServerController.debug('Server stopped');
    }
}
