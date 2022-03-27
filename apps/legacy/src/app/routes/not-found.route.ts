import { BaseRouter, Request, Response } from '@ionaru/micro-web-service';
import { StatusCodes } from 'http-status-codes';

export class NotFoundRoute extends BaseRouter {

    public constructor() {
        super();
        this.createRoute('all', '', this.notFoundRoute.bind(this));
    }

    /**
     * If no other route was able to handle the request, then we return a 404 NOT FOUND error.
     */
    private notFoundRoute(request: Request, response: Response) {
        return response.status(StatusCodes.NOT_FOUND).render('empty.hbs', {
            error: `Could not find page for ${request.originalUrl}`,
        });
    }
}
