import { BaseRouter, RequestHandler } from '@ionaru/micro-web-service';

export class LegacyRoute extends BaseRouter {

    public constructor(
        legacyProxy: RequestHandler,
    ) {
        super();
        this.createRoute('all', '*', legacyProxy);
    }
}
