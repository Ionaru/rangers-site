import { Request, Response } from '@ionaru/micro-web-service';
import {
    ISessionData,
    Permission,
    RankModel,
    SessionModel,
    TeamspeakUserModel,
    UserModel,
} from '@rangers-site/entities';

import { BaseRoute } from './base.route';

export class UsersRoute extends BaseRoute {

    public constructor() {
        super();
        this.createRoute('get', '/', UsersRoute.usersPage);

        this.createRoute('get', '/edit/:id', UsersRoute.editUserPage);
        this.createRoute('post', '/edit/:id', UsersRoute.editUser);

        this.createRoute('get', '/delete/:id', UsersRoute.userDeletePage);
        this.createRoute('post', '/delete/:id', UsersRoute.deleteUser);
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private static async editUser(request: Request, response: Response) {

        if (request.params.id === response.locals.user.id.toString()) {
            response.locals.error = 'You cannot edit yourself!';
            return UsersRoute.editUserPage(request, response);
        }

        const user = await UserModel.findOne(request.params.id);
        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        let rank: RankModel | undefined | null = null;
        if (request.body.rank) {
            rank = await RankModel.findOne(request.body.rank);
            if (!rank) {
                response.locals.error = 'Rank not found.';
                return UsersRoute.editUserPage(request, response);
            }
        }

        user.rank = rank;

        let ts3User: TeamspeakUserModel | undefined | null = null;
        if (request.body.ts3User) {
            ts3User = await TeamspeakUserModel.findOne(request.body.ts3User);
            if (!ts3User) {
                response.locals.error = 'Teamspeak user not found.';
                return UsersRoute.editUserPage(request, response);
            }
        }

        user.ts3User = ts3User;

        await user.save();
        return response.redirect('/users');
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private static async editUserPage(request: Request, response: Response) {
        const user = await UserModel.findOne(request.params.id, {relations: ['rank', 'ts3User']});

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        const ranks = await RankModel.find();
        const ts3Users = await TeamspeakUserModel.find({order: {nickname: 'ASC'}});
        return response.render('pages/users/edit.hbs', {ranks, user_: user, ts3Users});
    }

    @UsersRoute.requestDecorator(UsersRoute.checkLogin)
    private static async usersPage(_request: Request, response: Response) {
        const users = await UserModel.find({
            order: {name: 'ASC'},
            relations: ['rank', 'ts3User'],
        });
        return response.render('pages/users/index.hbs', {users});
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private static async userDeletePage(request: Request, response: Response) {
        const user = await UserModel.findOne(request.params.id);

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        return response.render('pages/users/delete.hbs', {user_: user});
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private static async deleteUser(request: Request, response: Response) {

        if (request.params.id === response.locals.user.id.toString()) {
            response.locals.error = 'You cannot delete yourself!';
            return UsersRoute.userDeletePage(request, response);
        }

        const user = await UserModel.findOne(request.params.id);

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        // Delete all active sessions of this user.
        const sessions = await SessionModel.find();
        const userSessions = sessions.filter((session) => {
            const data = JSON.parse(session.json) as ISessionData;
            return data.passport && data.passport.user === user.id;
        });
        await Promise.all(userSessions.map((session) => session.remove()));

        // TODO: Revoke user ranks on TS3 and Discord.

        // Delete user links.
        user.discordUser = null;
        user.ts3User = null;

        // Delete user privileges.
        user.rank = null;
        user.roles = [];
        user.badges = [];

        user.disabled = true;
        await user.save();

        return response.redirect('/users');
    }
}
