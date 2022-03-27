import { Request, Response } from '@ionaru/micro-web-service';

import { BaseRoute } from './base.route';

export class RootRoute extends BaseRoute {

    public constructor() {
        super();
        this.createRoute('get', '/', this.homePage.bind(this));
        this.createRoute('get', '/user', this.userPage.bind(this));
    }

    @RootRoute.requestDecorator(RootRoute.checkAdmin)
    private async userPage(_request: Request, response: Response) {
        return response.render('pages/user.hbs');
    }

    private homePage(_request: Request, response: Response): void {
        response.locals.title = 'home';
        return response.render('pages/home.hbs');
    }
}
