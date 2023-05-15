import { Request, Response } from '@ionaru/micro-web-service';
import { StatusCodes } from 'http-status-codes';

import { BaseRoute } from './base.route';

export class HandbookRoute extends BaseRoute {

    public constructor() {
        super();
        this.createRoute('get', '/', this.handbookIndex.bind(this));
        this.createRoute('get', '/:page', this.handbookPage.bind(this));
        this.createRoute('get', '/page/:page', this.handbookPage.bind(this));
    }

    private async handbookIndex(_request: Request, response: Response) {
        return response.render('pages/handbook/index.hbs');
    }

    private async handbookPage(request: Request, response: Response) {
        if (!('page' in request.params)) {
            return response.status(StatusCodes.NOT_FOUND).render('pages/handbook/404.hbs', {
                error: `Could not find page.`,
            });
        }

        return response.render(
            `pages/handbook/page/${request.params.page}.hbs`,
            {},
            (err, html) => err ? response.status(StatusCodes.NOT_FOUND).render('pages/handbook/404.hbs', {
                error: `Could not find page for ${request.originalUrl}`,
            }) : response.send(html),
        );
    }
}
