import { BaseRouter, Request, Response } from '@ionaru/micro-web-service';

export class HandshakeRoute extends BaseRouter {

    public constructor(
        // private readonly usersService: UsersService,
    ) {
        super();
        this.createRoute('get', '/', this.handshake.bind(this));
        this.createRoute('all', '/', HandshakeRoute.methodNotAllowed);
    }

    private async handshake(request: Request, response: Response) {
        if (!request.session || !request.session.user) {
            return HandshakeRoute.sendSuccess(response);
        }

        const userId = request.session.user;

        const user = userId; // TODO: implement UsersService.

        if (!user) {
            delete request.session.user;
            return request.session.save(() => {
                HandshakeRoute.sendSuccess(response);
            });
        }

        return HandshakeRoute.sendSuccess(response, user);
    }
}
