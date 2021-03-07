import { BaseRouter, Request, Response } from '@ionaru/micro-web-service';

export class NotFoundRoute extends BaseRouter {

    public constructor() {
        super();
        this.createRoute('all', '/', NotFoundRoute.notFoundRoute);
    }

    /**
     * If no other route was able to handle the request, then we return a 404 NOT FOUND error.
     */
    private static notFoundRoute(request: Request, response: Response): Response {
        return NotFoundRoute.sendNotFound(response, request.originalUrl);
    }
}
