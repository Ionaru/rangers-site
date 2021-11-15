import { Request, Response } from '@ionaru/micro-web-service';
import { BadgeModel, RankModel, RoleModel, UserModel } from '@rangers-site/entities';
import * as passport from 'passport';
import { Profile, Strategy } from 'passport-discord';
import * as oauth2 from 'passport-oauth2';

import { DiscordService } from '../services/discord.service';

import { BaseRoute } from './base.route';

export class AuthRoute extends BaseRoute {

    public constructor(
        private readonly discordService: DiscordService,
    ) {
        super();

        const clientID = process.env.RANGERS_DISCORD_CLIENT_ID;
        const clientSecret = process.env.RANGERS_DISCORD_CLIENT_SECRET;
        const callbackURL = process.env.RANGERS_DISCORD_RETURN_URL;

        if (!clientID || !clientSecret || !callbackURL) {
            throw new Error('Configuration error, missing OAuth credentials.');
        }

        passport.use(new Strategy({
            callbackURL,
            clientID,
            clientSecret,
            scope: ['identify'],
        }, this.processAuth.bind(this)));

        passport.serializeUser<number>(AuthRoute.serialize);
        passport.deserializeUser<number>(AuthRoute.deserialize);

        this.createRoute('get', '', AuthRoute.render('pages/auth.hbs'));
        this.createRoute('get', '/logout', AuthRoute.logout);
        this.createRoute('get', '/login', passport.authenticate('discord'));
        this.createRoute('get', '/login/return',
            passport.authenticate('discord', {
                failureRedirect: '/auth',
            }),
            AuthRoute.login,
        );
    }

    public static async serialize(user: UserModel, done: (err: any, id: number) => void): Promise<void> {
        done(undefined, user.id);
    }

    public static async deserialize(id: number, done: (err: any, user: UserModel | undefined) => void): Promise<void> {
        const user = await UserModel.doQuery()
            .leftJoinAndSelect(`${UserModel.alias}.rank`, RankModel.alias)
            .leftJoinAndSelect(`rank.permissions`, 'rank_permissions')
            .leftJoinAndSelect(`${UserModel.alias}.roles`, RoleModel.alias)
            .leftJoinAndSelect(`role.permissions`, 'role_permissions')
            .leftJoinAndSelect(`${UserModel.alias}.badges`, BadgeModel.alias)
            .where(`${UserModel.alias}.id = :id`, { id })
            .getOne();
        done(undefined, user);
    }

    private static async login(request: Request, response: Response) {
        if (request.session) {
            request.session.save(() => response.redirect('/'));
        }
    }

    private static async logout(request: Request, response: Response) {
        request.logout();
        if (request.session) {
            request.session.save(() => response.redirect('/'));
        }
    }

    public async processAuth(
        _accessToken: string, _refreshToken: string, profile: Profile, done: oauth2.VerifyCallback,
    ): Promise<void> {
        let user = await UserModel.doQuery().where({ discordUser: profile.id }).getOne();

        if (!user) {
            user = new UserModel(profile.id, profile.username);
            await user.save();
        }

        const name = await this.discordService.getNameFromId(profile.id);
        if (user.name !== name) {
            user.name = name;
            await user.save();
        }

        done(undefined, user);
    }
}
