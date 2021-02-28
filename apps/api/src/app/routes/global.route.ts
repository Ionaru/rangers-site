import { BaseRouter, NextFunction, Request, Response } from '@ionaru/micro-web-service';
import { StatusCodes } from 'http-status-codes';

export class GlobalRoute extends BaseRouter {

    public constructor() {
        super();
        this.createRoute('all', '/', GlobalRoute.addSessionUser);
    }

    /**
     * All requests to the server go through this router (except when fetching static files).
     */
    private static addSessionUser(request: Request, response: Response, next?: NextFunction): Response | void {

        if (!request.session) {
            return GlobalRoute.sendResponse(response, StatusCodes.BAD_REQUEST, 'NoSession');
        }

        // Continue to the other routes
        if (next) {
            next();
        }
    }
}
