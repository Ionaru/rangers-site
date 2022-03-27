import { NextFunction, Request, Response } from '@ionaru/micro-web-service';
import { UserModel } from '@rangers-site/entities';
import { StatusCodes } from 'http-status-codes';

import { BaseRoute } from './base.route';

export class GlobalRoute extends BaseRoute {

    public constructor() {
        super();
        this.createRoute('all', '*', this.globalRoute.bind(this));
    }

    /**
     * All requests to the server go through this router (except when fetching static files).
     */
    private async globalRoute(request: Request, response: Response, next?: NextFunction): Promise<Response | void> {

        if (!request.session) {
            return GlobalRoute.sendResponse(response, StatusCodes.BAD_REQUEST, 'NoSession');
        }

        const user = request.user as UserModel | undefined;

        if (user) {

            if (user.disabled) {
                request.logout();
                response.locals.error = 'This account is disabled, you cannot log in.';
                if (request.session) {
                    request.session.save(() => response.redirect('/'));
                }
                return;
            }

            // Add the user data when one is logged in.
            response.locals.user = user;
        }

        if (next) {
            next();
        }
    }
}
