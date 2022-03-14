import { Request, Response } from '@ionaru/micro-web-service';
import { EnjinTagModel, Permission, RankModel, TeamspeakRankModel } from '@rangers-site/entities';
import { DefinedError } from 'ajv';

import { EnjinService } from '../services/enjin.service';
import { TeamspeakService } from '../services/teamspeak.service';

import { BaseRoute, IPermissionableInput } from './base.route';

export class RanksRoute extends BaseRoute {

    private static teamspeak: TeamspeakService;
    private static enjin: EnjinService;

    public constructor(teamSpeak: TeamspeakService, enjin: EnjinService) {
        super();
        RanksRoute.teamspeak = teamSpeak;
        RanksRoute.enjin = enjin;
        this.createRoute('get', '/', RanksRoute.ranksPage);

        this.createRoute('get', '/create', RanksRoute.rankCreatePage);
        this.createRoute('post', '/create', this.createRank.bind(this));

        this.createRoute('get', '/edit/:id', RanksRoute.rankEditPage);
        this.createRoute('post', '/edit/:id', this.editRank.bind(this));

        this.createRoute('get', '/delete/:id', RanksRoute.rankDeletePage);
        this.createRoute('post', '/delete/:id', RanksRoute.deleteRank);
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private async editRank(request: Request<any, IPermissionableInput>, response: Response) {

        if (!this.permissionableValidator(request.body)) {
            response.locals.error = this.permissionableValidator.errors as DefinedError[];
            return RanksRoute.rankEditPage(request, response);
        }

        const rankError = await RanksRoute.validateAssignableInput(request.body, RankModel.doQuery(), request.params.id);
        if (rankError) {
            response.locals.error = rankError;
            return RanksRoute.rankEditPage(request, response);
        }

        const rank = await RankModel.findOne(request.params.id);

        if (!rank) {
            return RanksRoute.sendNotFound(response, request.originalUrl);
        }

        rank.name = request.body.name;

        if (request.body.tsRank) {
            const teamspeakRankError = await RanksRoute.setTeamspeakRank(request.body.tsRank, rank, RanksRoute.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return RanksRoute.rankEditPage(request, response);
            }
        } else {
            rank.teamspeakRank = null;
        }

        if (request.body.enjinTag) {
            const enjinRankError = await RanksRoute.setEnjinTag(request.body.enjinTag, rank, RanksRoute.enjin);
            if (enjinRankError) {
                response.locals.error = enjinRankError;
                return RanksRoute.rankEditPage(request, response);
            }
        } else {
            rank.enjinTag = null;
        }

        const permissionsError = await RanksRoute.setPermissions(request.body.permissions, rank);
        if (permissionsError) {
            response.locals.error = permissionsError;
            return RanksRoute.rankEditPage(request, response);
        }

        if (request.files) {
            const fileUploadError = await RanksRoute.setImage(request.files, rank);
            if (fileUploadError) {
                response.locals.error = fileUploadError;
                return RanksRoute.rankEditPage(request, response);
            }
        }

        await rank.save();

        return response.redirect('/ranks');
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private static async rankEditPage(request: Request<{id: number}>, response: Response) {
        const rank = await RankModel.findOne(request.params.id, { relations: ['teamspeakRank', 'enjinTag', 'permissions'] });

        if (!rank) {
            return RanksRoute.sendNotFound(response, request.originalUrl);
        }

        const enjinTags = await RanksRoute.enjin.getTags();
        const tsRanks = await RanksRoute.teamspeak.getRanks();
        const permissions = Object.entries(Permission).map((permissionEntry) => ({
            name: permissionEntry[1],
            slug: permissionEntry[0],
        }));
        return response.render('pages/ranks/edit.hbs', { enjinTags, permissions, rank, tsRanks });
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private static async rankDeletePage(request: Request<{id: number}>, response: Response) {
        const rank = await RankModel.findOne(request.params.id);

        if (!rank) {
            return RanksRoute.sendNotFound(response, request.originalUrl);
        }

        return response.render('pages/ranks/delete.hbs', { rank });
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private static async deleteRank(request: Request<{id: number}>, response: Response) {
        const rank = await RankModel.findOne(request.params.id, { relations: ['users'] });

        if (!rank) {
            return RanksRoute.sendNotFound(response, request.originalUrl);
        }

        if (rank.users.length) {
            response.locals.error = 'Cannot delete a rank that is still in use.';
            return RanksRoute.rankDeletePage(request, response);
        }

        await rank.remove();

        return response.redirect('/ranks');
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private static async rankCreatePage(_request: Request, response: Response) {
        const enjinTags = await RanksRoute.enjin.getTags();
        const tsRanks = await RanksRoute.teamspeak.getRanks();
        const permissions = Object.entries(Permission).map((permissionEntry) => ({
            name: permissionEntry[1],
            slug: permissionEntry[0],
        }));
        return response.render('pages/ranks/create.hbs', { enjinTags, permissions, tsRanks });
    }

    @RanksRoute.requestDecorator(RanksRoute.checkLogin)
    private static async ranksPage(_request: Request, response: Response) {
        const ranks = await RankModel.doQuery()
            .leftJoinAndSelect(`${RankModel.alias}.teamspeakRank`, TeamspeakRankModel.alias)
            .leftJoinAndSelect(`${RankModel.alias}.enjinTag`, EnjinTagModel.alias)
            .orderBy(`${RankModel.alias}.id`, 'ASC')
            .getMany();
        return response.render('pages/ranks/index.hbs', { ranks });
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private async createRank(request: Request<any, IPermissionableInput>, response: Response) {

        if (!this.permissionableValidator(request.body)) {
            response.locals.error = this.permissionableValidator.errors as DefinedError[];
            return RanksRoute.rankCreatePage(request, response);
        }

        const rankError = await RanksRoute.validateAssignableInput(request.body, RankModel.doQuery());
        if (rankError) {
            response.locals.error = rankError;
            return RanksRoute.rankCreatePage(request, response);
        }

        const rank = new RankModel(request.body.name);

        if (request.body.tsRank) {
            const teamspeakRankError = await RanksRoute.setTeamspeakRank(request.body.tsRank, rank, RanksRoute.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return RanksRoute.rankCreatePage(request, response);
            }
        }

        if (request.body.enjinTag) {
            const enjinRankError = await RanksRoute.setEnjinTag(request.body.enjinTag, rank, RanksRoute.enjin);
            if (enjinRankError) {
                response.locals.error = enjinRankError;
                return RanksRoute.rankCreatePage(request, response);
            }
        }

        const permissionsError = await RanksRoute.setPermissions(request.body.permissions, rank);
        if (permissionsError) {
            response.locals.error = permissionsError;
            return RanksRoute.rankEditPage(request, response);
        }

        await rank.save();

        return response.redirect('/ranks');
    }
}
