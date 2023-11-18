import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { Request, Response } from '@ionaru/micro-web-service';
import {
    BadgeModel,
    ISessionData,
    Permission,
    RankModel,
    RoleModel,
    SessionModel,
    TeamspeakUserModel,
    UserModel,
} from '@rangers-site/entities';
import { ValidateFunction } from 'ajv';

import { DiscordService } from '../services/discord.service';
import { TeamspeakService } from '../services/teamspeak.service';
import { objectType, stringArrayType, stringType } from '../utils/ajv-types';

import { BaseRoute } from './base.route';

interface IUserInput {
    badges: string | string[];
    roles: string | string[];
    rank: string;
    ts3User: string;
}

interface ILinkInput {
    discordUser: string;
    ts3User: string;
}

export class UsersRoute extends BaseRoute {

    private readonly userValidator: ValidateFunction<IUserInput>;
    private readonly linkValidator: ValidateFunction<ILinkInput>;

    public constructor(
        private readonly teamspeak: TeamspeakService,
        private readonly discord: DiscordService,
    ) {
        super();
        this.createRoute('get', '/', this.usersPage.bind(this));

        this.createRoute('get', '/link', this.linkUserPage.bind(this));
        this.createRoute('post', '/link', this.linkUser.bind(this));

        this.createRoute('get', '/edit/:id', this.editUserPage.bind(this));
        this.createRoute('post', '/edit/:id', this.editUser.bind(this));

        this.createRoute('get', '/delete/:id', this.userDeletePage.bind(this));
        this.createRoute('post', '/delete/:id', this.deleteUser.bind(this));

        this.createRoute('get', '/sync/:id', this.syncUser.bind(this));

        this.userValidator = this.createValidateFunction({
            properties: {
                badges: {
                    default: [],
                    oneOf: [
                        stringType,
                        stringArrayType,
                    ],
                },
                rank: {
                    default: undefined,
                    ...stringType,
                },
                roles: {
                    default: [],
                    oneOf: [
                        stringType,
                        stringArrayType,
                    ],
                },
                ts3User: {
                    default: undefined,
                    ...stringType,
                },
            },
            required: ['ts3User'],
            ...objectType,
        });

        this.linkValidator = this.createValidateFunction({
            properties: {
                discordUser: {
                    minLength: 1,
                    type: 'string',
                },
                ts3User: {
                    minLength: 1,
                    type: 'string',
                },
            },
            required: ['discordUser', 'ts3User'],
            type: 'object',
        });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    // eslint-disable-next-line sonarjs/cognitive-complexity
    private async editUser(request: Request<{ id: number; }>, response: Response) {

        if (UsersRoute.isAboutSelf(request) && !UsersRoute.isAdmin(request)) {
            response.locals.error = 'You cannot edit yourself!';
            return this.editUserPage(request, response);
        }

        if (!this.userValidator(request.body)) {
            return UsersRoute.renderValidationError(response, this.userValidator, this.editUserPage.bind(this));
        }

        const user = await UserModel.findOne(request.params.id,
            { relations: ['rank', 'roles', 'badges'] },
        );
        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        let rank: RankModel | undefined | null = null;
        if (request.body.rank) {
            rank = await RankModel.findOne(request.body.rank);
            if (!rank) {
                response.locals.error = 'Rank not found.';
                return this.editUserPage(request, response);
            }
        }

        user.rank = rank;

        let roles: RoleModel[] | undefined | null = [];
        if (request.body.roles.length) {
            const roleIds = Array.isArray(request.body.roles) ? request.body.roles : [request.body.roles];
            roles = await RoleModel.findByIds(roleIds);
            if (!roles.length) {
                response.locals.error = 'Roles not found.';
                return this.editUserPage(request, response);
            }
        }

        user.roles = roles;

        let badges: BadgeModel[] | undefined | null = [];
        if (request.body.badges.length) {
            const badgeIds = Array.isArray(request.body.badges) ? request.body.badges : [request.body.badges];
            badges = await BadgeModel.findByIds(badgeIds);
            if (!badges.length) {
                response.locals.error = 'Badges not found.';
                return this.editUserPage(request, response);
            }
        }

        user.badges = badges;

        let ts3User: typeof user.ts3User = null;
        if (request.body.ts3User) {
            ts3User = await TeamspeakUserModel.findOne(request.body.ts3User);
            if (!ts3User) {
                response.locals.error = 'Teamspeak user not found.';
                return this.editUserPage(request, response);
            }
        }

        user.ts3User = ts3User;

        await user.save();

        if (user.ts3User) {
            await this.teamspeak.syncUser(user);
        }

        if (user.discordUser) {
            await this.discord.syncUser(user);
        }

        return response.redirect('/users');
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private async editUserPage(request: Request<{ id: number; }>, response: Response) {
        const user = await UserModel.findOne(request.params.id,
            { relations: ['rank', 'roles', 'badges', 'ts3User'] },
        );

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        const ranks = await RankModel.find();
        const roles = await RoleModel.find();
        const badges = await BadgeModel.find();
        const ts3Users = await TeamspeakUserModel.find({ order: { nickname: 'ASC' } });

        // eslint-disable-next-line @typescript-eslint/naming-convention
        return response.render('pages/users/edit.hbs', { badges, ranks, roles, ts3Users, user_: user });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private async linkUser(request: Request, response: Response) {

        if (!this.linkValidator(request.body)) {
            return UsersRoute.renderValidationError(response, this.linkValidator, this.linkUserPage.bind(this));
        }

        if (request.user?.discordUser === request.body.discordUser && !UsersRoute.isAdmin(request)) {
            response.locals.error = 'You cannot edit yourself!';
            return this.linkUserPage(request, response);
        }

        const existingLinkedTS3User = await UserModel.findOne({ where: { ts3User: request.body.ts3User } });
        if (existingLinkedTS3User && existingLinkedTS3User.discordUser !== request.body.discordUser) {
            response.locals.error = `TS3 user already linked to: ${existingLinkedTS3User}.`;
            return this.linkUserPage(request, response);
        }

        // Get or create user from Discord id.
        let user = await UserModel.findOne({
            relations: ['ts3User'],
            where: { discordUser: request.body.discordUser },
        });

        if (!user) {
            const name = await this.discord.getNameFromId(request.body.discordUser);
            user = await new UserModel(request.body.discordUser, name).save();
        }

        // Link user to TS3 user.
        user.ts3User = await TeamspeakUserModel.findOneOrFail(request.body.ts3User);

        await user.save();

        return response.redirect(`/users/sync/${user.id}`);
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private async linkUserPage(_: Request, response: Response) {

        const allUsers = await UserModel.find();

        const allDiscordUsers = await this.discord.getUsersInServer();
        const discordUsers = allDiscordUsers.filter(
            (discordUser) => !allUsers.find(
                (user) => user.discordUser === discordUser.id && user.rank,
            ),
        );
        sortArrayByObjectProperty(discordUsers, (x) => x.user.username);

        const allTS3Users = await TeamspeakUserModel.find({ order: { nickname: 'ASC' } });
        const ts3Users = allTS3Users.filter(
            (teamspeakUser) => !allUsers.find(
                (user) => user.ts3User?.id === teamspeakUser.id,
            ),
        );

        return response.render('pages/users/link.hbs', { discordUsers, ts3Users });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkLogin)
    private async usersPage(_request: Request, response: Response) {
        const users = await UserModel.doQuery()
            .innerJoinAndSelect(`${UserModel.alias}.rank`, RankModel.alias)
            .leftJoinAndSelect(`${UserModel.alias}.roles`, RoleModel.alias)
            .leftJoinAndSelect(`${UserModel.alias}.badges`, BadgeModel.alias)
            .leftJoinAndSelect(`${UserModel.alias}.ts3User`, TeamspeakUserModel.alias)
            .orderBy(`${UserModel.alias}.rank`, 'ASC')
            .addOrderBy(`${UserModel.alias}.name`, 'ASC')
            .addOrderBy(`${BadgeModel.alias}.name`, 'ASC')
            .addOrderBy(`${RoleModel.alias}.name`, 'ASC')
            .getMany();

        return response.render('pages/users/index.hbs', { users });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private async userDeletePage(request: Request<{ id: number; }>, response: Response) {
        const user = await UserModel.findOne(request.params.id);

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        return response.render('pages/users/delete.hbs', { user_: user });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private async deleteUser(request: Request<{ id: number; }>, response: Response) {

        if (UsersRoute.isAboutSelf(request)) {
            response.locals.error = 'You cannot delete yourself!';
            return this.userDeletePage(request, response);
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

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private async syncUser(request: Request<{ id: number; }>, response: Response) {

        const user = await UserModel.findOne(request.params.id);

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        return response.redirect('/users');
    }
}
