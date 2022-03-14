import { objectToObjectsArray, sortArrayByObjectProperty } from '@ionaru/array-utils';
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
import { DefinedError, ValidateFunction } from 'ajv';
import { In } from 'typeorm';

import { EnjinService } from '../services/enjin.service';
import { TeamspeakService } from '../services/teamspeak.service';

import { BaseRoute } from './base.route';

interface IUserInput {
    ts3User?: number;
}

export class UsersRoute extends BaseRoute {

    private static teamspeak: TeamspeakService;
    private static enjin: EnjinService;

    private readonly userValidator: ValidateFunction<IUserInput>;

    public constructor(teamSpeak: TeamspeakService, enjin: EnjinService) {
        super();
        UsersRoute.teamspeak = teamSpeak;
        UsersRoute.enjin = enjin;
        this.createRoute('get', '/', UsersRoute.usersPage);

        this.createRoute('get', '/edit/:id', UsersRoute.editUserPage);
        this.createRoute('post', '/edit/:id', this.editUser.bind(this));

        this.createRoute('get', '/delete/:id', UsersRoute.userDeletePage);
        this.createRoute('post', '/delete/:id', UsersRoute.deleteUser);

        this.createRoute('get', '/sync/:id', UsersRoute.syncUser);

        this.userValidator = this.createValidateFunction({
            properties: {
                ts3User: {
                    nullable: true,
                    type: 'number',
                },
            },
            type: 'object',
        });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private async editUser(request: Request<{id: number}>, response: Response) {

        const admins = process.env.RANGERS_ADMINS?.split(',');
        if (!admins?.includes(response.locals.user.discordUser) && request.params.id === response.locals.user.id.toString()) {
            response.locals.error = 'You cannot edit yourself!';
            return UsersRoute.editUserPage(request, response);
        }

        if (!this.userValidator(request.body)) {
            response.locals.error = this.userValidator.errors as DefinedError[];
            return UsersRoute.editUserPage(request, response);
        }

        const user = await UserModel.findOne(request.params.id,
            { relations: ['rank', 'roles', 'badges'] },
        );
        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        // NOTE: Ranks, roles and badges are synced with Enjin currently.

        /*
        // let rank: RankModel | undefined | null = null;
        // if (request.body.rank) {
        //     rank = await RankModel.findOne(request.body.rank);
        //     if (!rank) {
        //         response.locals.error = 'Rank not found.';
        //         return UsersRoute.editUserPage(request, response);
        //     }
        // }

        // user.rank = rank;

        // let roles: RoleModel[] | undefined | null = [];
        // if (request.body.roles) {
        //     roles = await RoleModel.findByIds(request.body.roles);
        //     if (!roles.length) {
        //         response.locals.error = 'Roles not found.';
        //         return UsersRoute.editUserPage(request, response);
        //     }
        // }

        // user.roles = roles;

        // let badges: BadgeModel[] | undefined | null = [];
        // if (request.body.badges) {
        //     badges = await BadgeModel.findByIds(request.body.badges);
        //     if (!badges.length) {
        //         response.locals.error = 'Badges not found.';
        //         return UsersRoute.editUserPage(request, response);
        //     }
        // }

        // user.badges = badges;
        */

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

        await UsersRoute.teamspeak.syncUser(user);

        return response.redirect('/users');
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private static async editUserPage(request: Request<{id: number}>, response: Response) {
        const user = await UserModel.findOne(request.params.id,
            { relations: ['rank', 'roles', 'badges', 'ts3User'] },
        );

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        const ranks = await RankModel.find();
        const roles = await RoleModel.find();
        const ts3Users = await TeamspeakUserModel.find({ order: { nickname: 'ASC' } });
        const rankEnjinTags = await RankModel.getEnjinTags();
        const enjinResponse = await UsersRoute.enjin.getUsersWithTags(...rankEnjinTags);

        const enjinUsers = sortArrayByObjectProperty(objectToObjectsArray(enjinResponse), (x) => x.username);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return response.render('pages/users/edit.hbs', { enjinUsers, ranks, roles, ts3Users, user_: user });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkLogin)
    private static async usersPage(_request: Request, response: Response) {
        const users = await UserModel.doQuery()
            .leftJoinAndSelect(`${UserModel.alias}.rank`, RankModel.alias)
            .leftJoinAndSelect(`${UserModel.alias}.roles`, RoleModel.alias)
            .leftJoinAndSelect(`${UserModel.alias}.badges`, BadgeModel.alias)
            .leftJoinAndSelect(`${UserModel.alias}.ts3User`, TeamspeakUserModel.alias)
            .orderBy(`${UserModel.alias}.name`, 'ASC')
            .getMany();

        const rankEnjinTags = await RankModel.getEnjinTags();
        const enjinUsers = await UsersRoute.enjin.getUsersWithTags(...rankEnjinTags);

        return response.render('pages/users/index.hbs', { enjinUsers, users });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private static async userDeletePage(request: Request<{id: number}>, response: Response) {
        const user = await UserModel.findOne(request.params.id);

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        return response.render('pages/users/delete.hbs', { user_: user });
    }

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private static async deleteUser(request: Request<{id: number}>, response: Response) {

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

    @UsersRoute.requestDecorator(UsersRoute.checkPermission, Permission.EDIT_USER_RANK)
    private static async syncUser(request: Request<{id: number}>, response: Response) {

        const user = await UserModel.findOne(request.params.id);

        if (!user) {
            return UsersRoute.sendNotFound(response, request.originalUrl);
        }

        if (!user.enjinUser) {
            response.locals.error = `User ${user.name} has no linked Enjin account, cannot sync.`;
            return UsersRoute.usersPage(request, response);
        }

        if (!user.ts3User) {
            response.locals.error = `User ${user.name} has no linked TS3 account, cannot sync.`;
            return UsersRoute.usersPage(request, response);
        }

        const userTags = await UsersRoute.enjin.getUserTags(user.enjinUser);

        const rank = await RankModel.findOne({
            relations: ['enjinTag', 'teamspeakRank'],
            where: { enjinTag: { id: In([...userTags.map((t) => t.tag_id)]) } },
        }) || null;

        const roles = await RoleModel.find({
            relations: ['enjinTag', 'teamspeakRank'],
            where: { enjinTag: { id: In([...userTags.map((t) => t.tag_id)]) } },
        });

        const badges = await BadgeModel.find({
            relations: ['enjinTag', 'teamspeakRank'],
            where: { enjinTag: { id: In([...userTags.map((t) => t.tag_id)]) } },
        });

        user.rank = rank;
        user.roles = roles;
        user.badges = badges;
        await user.save();

        await UsersRoute.teamspeak.syncUser(user);

        return response.redirect('/users');
    }
}
