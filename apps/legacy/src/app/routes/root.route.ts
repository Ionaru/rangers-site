import { Request, Response } from '@ionaru/micro-web-service';

import { BaseRoute } from './base.route';

export class RootRoute extends BaseRoute {

    public constructor() {
        super();
        this.createRoute('get', '', RootRoute.homePage);
        this.createRoute('get', '/user', RootRoute.userPage);
    }

    public static homePage(_request: Request, response: Response): void {
        response.locals.title = 'home';
        return response.render('pages/home.hbs');
    }

    @RootRoute.requestDecorator(RootRoute.checkLogin)
    private static async userPage(_request: Request, response: Response) {
        return response.render('pages/user.hbs');
    }
}
