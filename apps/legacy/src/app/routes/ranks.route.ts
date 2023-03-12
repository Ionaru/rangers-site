import { Request, Response } from '@ionaru/micro-web-service';
import { Permission, RankModel, TeamspeakRankModel } from '@rangers-site/entities';

import { TeamspeakService } from '../services/teamspeak.service';

import { BaseRoute, IPermissionableInput } from './base.route';

export class RanksRoute extends BaseRoute {

    public constructor(
        private readonly teamspeak: TeamspeakService,
    ) {
        super();
        this.createRoute('get', '/', this.ranksPage.bind(this));

        this.createRoute('get', '/create', this.rankCreatePage.bind(this));
        this.createRoute('post', '/create', this.createRank.bind(this));

        this.createRoute('get', '/edit/:id', this.rankEditPage.bind(this));
        this.createRoute('post', '/edit/:id', this.editRank.bind(this));

        this.createRoute('get', '/delete/:id', this.rankDeletePage.bind(this));
        this.createRoute('post', '/delete/:id', this.deleteRank.bind(this));
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    // eslint-disable-next-line sonarjs/cognitive-complexity
    private async editRank(request: Request<any, IPermissionableInput>, response: Response) {

        if (!this.permissionableValidator(request.body)) {
            return RanksRoute.renderValidationError(response, this.permissionableValidator, this.rankEditPage.bind(this));
        }

        const rankError = await RanksRoute.validateAssignableInput(request.body, RankModel.doQuery(), request.params.id);
        if (rankError) {
            response.locals.error = rankError;
            return this.rankEditPage(request, response);
        }

        const rank = await RankModel.findOne(request.params.id);

        if (!rank) {
            return RanksRoute.sendNotFound(response, request.originalUrl);
        }

        rank.name = request.body.name;

        if (request.body.tsRank) {
            const teamspeakRankError = await RanksRoute.setTeamspeakRank(request.body.tsRank, rank, this.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return this.rankEditPage(request, response);
            }
        } else {
            rank.teamspeakRank = null;
        }

        const permissionsError = await RanksRoute.setPermissions(request.body.permissions, rank);
        if (permissionsError) {
            response.locals.error = permissionsError;
            return this.rankEditPage(request, response);
        }

        if (request.files) {
            const fileUploadError = await RanksRoute.setImage(request.files, rank);
            if (fileUploadError) {
                response.locals.error = fileUploadError;
                return this.rankEditPage(request, response);
            }
        }

        await rank.save();

        return response.redirect('/ranks');
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private async rankEditPage(request: Request<{ id: number; }>, response: Response) {
        const rank = await RankModel.findOne(request.params.id, { relations: ['teamspeakRank', 'permissions'] });

        if (!rank) {
            return RanksRoute.sendNotFound(response, request.originalUrl);
        }

        const tsRanks = await this.teamspeak.getRanks();
        const permissions = Object.entries(Permission).map((permissionEntry) => ({
            name: permissionEntry[1],
            slug: permissionEntry[0],
        }));
        return response.render('pages/ranks/edit.hbs', { permissions, rank, tsRanks });
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private async rankDeletePage(request: Request<{ id: number; }>, response: Response) {
        const rank = await RankModel.findOne(request.params.id);

        if (!rank) {
            return RanksRoute.sendNotFound(response, request.originalUrl);
        }

        return response.render('pages/ranks/delete.hbs', { rank });
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private async deleteRank(request: Request<{ id: number; }>, response: Response) {
        const rank = await RankModel.findOne(request.params.id, { relations: ['users'] });

        if (!rank) {
            return RanksRoute.sendNotFound(response, request.originalUrl);
        }

        if (rank.users.length) {
            response.locals.error = 'Cannot delete a rank that is still in use.';
            return this.rankDeletePage(request, response);
        }

        await rank.remove();

        return response.redirect('/ranks');
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private async rankCreatePage(_request: Request, response: Response) {
        const tsRanks = await this.teamspeak.getRanks();
        const permissions = Object.entries(Permission).map((permissionEntry) => ({
            name: permissionEntry[1],
            slug: permissionEntry[0],
        }));
        return response.render('pages/ranks/create.hbs', { permissions, tsRanks });
    }

    @RanksRoute.requestDecorator(RanksRoute.checkLogin)
    private async ranksPage(_request: Request, response: Response) {
        const ranks = await RankModel.doQuery()
            .leftJoinAndSelect(`${RankModel.alias}.teamspeakRank`, TeamspeakRankModel.alias)
            .orderBy(`${RankModel.alias}.id`, 'ASC')
            .getMany();
        return response.render('pages/ranks/index.hbs', { ranks });
    }

    @RanksRoute.requestDecorator(RanksRoute.checkPermission, Permission.EDIT_RANKS)
    private async createRank(request: Request<any, IPermissionableInput>, response: Response) {

        if (!this.permissionableValidator(request.body)) {
            return RanksRoute.renderValidationError(response, this.permissionableValidator, this.rankCreatePage.bind(this));
        }

        const rankError = await RanksRoute.validateAssignableInput(request.body, RankModel.doQuery());
        if (rankError) {
            response.locals.error = rankError;
            return this.rankCreatePage(request, response);
        }

        const rank = new RankModel(request.body.name);

        if (request.body.tsRank) {
            const teamspeakRankError = await RanksRoute.setTeamspeakRank(request.body.tsRank, rank, this.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return this.rankCreatePage(request, response);
            }
        }

        const permissionsError = await RanksRoute.setPermissions(request.body.permissions, rank);
        if (permissionsError) {
            response.locals.error = permissionsError;
            return this.rankEditPage(request, response);
        }

        await rank.save();

        return response.redirect('/ranks');
    }
}
