import { format } from 'util';

import { handleExceptions, handleSignals, NotFoundRoute } from '@ionaru/micro-web-service';
import { config } from 'dotenv';

import { ServerController } from './app/controllers/server.controller';
import { GlobalRoute } from './app/routes/global.route';
import { HandshakeRoute } from './app/routes/handshake.route';
import { debug } from './debug';

let serverController: ServerController;

const start = async () => {

    debug(`ranger-site (api): ${process.env.NODE_ENV}!`);

    config();

    // const usersProxy = new UsersProxyController().init();

    // const usersService = new UsersClientController().init();

    serverController = new ServerController([
        ['*', new GlobalRoute()],
        ['/', new HandshakeRoute()],
        ['*', new NotFoundRoute()],
    ]);
    await serverController.init();

    handleExceptions(stop, exit);
    handleSignals(stop, exit, debug);
};

const stop = async () => {
    await serverController.stop();
};

const exit = (code = 0) => {
    debug('Dismissed!');
    process.exit(code);
};

start().catch((error) => {
    process.stderr.write(`${format(error)}\n`);
    process.exit(1);
});
