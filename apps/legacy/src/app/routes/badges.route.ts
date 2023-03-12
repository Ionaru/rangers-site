import { NextFunction, Request, Response } from '@ionaru/micro-web-service';
import { BadgeModel, Permission, TeamspeakRankModel } from '@rangers-site/entities';

import { TeamspeakService } from '../services/teamspeak.service';

import { BaseRoute, IAssignableInput } from './base.route';

export class BadgesRoute extends BaseRoute {

    public constructor(
        private readonly teamspeak: TeamspeakService,
    ) {
        super();
        this.createRoute('get', '/', this.badgesPage.bind(this));

        this.createRoute('get', '/create', this.badgeCreatePage.bind(this));
        this.createRoute('post', '/create', this.createBadge.bind(this));

        this.createRoute('get', '/edit/:id', this.badgeEditPage.bind(this));
        this.createRoute('post', '/edit/:id', this.editBadge.bind(this));

        this.createRoute('get', '/delete/:id', this.badgeDeletePage.bind(this));
        this.createRoute('post', '/delete/:id', this.deleteBadge.bind(this));
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private async editBadge(request: Request<any, IAssignableInput>, response: Response) {

        if (!this.assignableValidator(request.body)) {
            return BadgesRoute.renderValidationError(response, this.assignableValidator, this.badgeEditPage.bind(this));
        }

        const badgeError = await BadgesRoute.validateAssignableInput(request.body, BadgeModel.doQuery(), request.params.id);
        if (badgeError) {
            response.locals.error = badgeError;
            return this.badgeEditPage(request, response);
        }

        const badge = await BadgeModel.findOne(request.params.id);

        if (!badge) {
            return BadgesRoute.sendNotFound(response, request.originalUrl);
        }

        badge.name = request.body.name;

        if (request.body.tsRank) {
            const teamspeakRankError = await BadgesRoute.setTeamspeakRank(request.body.tsRank, badge, this.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return this.badgeEditPage(request, response);
            }
        } else {
            badge.teamspeakRank = null;
        }

        await badge.save();

        return response.redirect('/badges');
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private async badgeEditPage(request: Request<{ id: number; }>, response: Response, next?: NextFunction) {
        const badge = await BadgeModel.findOne(request.params.id, { relations: ['teamspeakRank'] });

        if (!badge) {
            return next ? next() : BadgesRoute.sendNotFound(response, request.originalUrl);
        }

        const tsRanks = await this.teamspeak.getRanks();

        return response.render('pages/badges/edit.hbs', { badge, tsRanks });
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private async badgeDeletePage(request: Request<{ id: number; }>, response: Response) {
        const badge = await BadgeModel.findOne(request.params.id);

        if (!badge) {
            return BadgesRoute.sendNotFound(response, request.originalUrl);
        }

        return response.render('pages/badges/delete.hbs', { badge });
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private async deleteBadge(request: Request<{ id: number; }>, response: Response) {
        const badge = await BadgeModel.findOne(request.params.id, { relations: ['users'] });

        if (!badge) {
            return BadgesRoute.sendNotFound(response, request.originalUrl);
        }

        if (badge.users.length) {
            response.locals.error = 'Cannot delete a badge that is still in use.';
            return this.badgeDeletePage(request, response);
        }

        await badge.remove();

        return response.redirect('/badges');
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private async badgeCreatePage(_request: Request, response: Response) {
        const tsRanks = await this.teamspeak.getRanks();

        return response.render('pages/badges/create.hbs', { tsRanks });
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkLogin)
    private async badgesPage(_request: Request, response: Response) {
        const badges = await BadgeModel.doQuery()
            .leftJoinAndSelect(`${BadgeModel.alias}.teamspeakRank`, TeamspeakRankModel.alias)
            .orderBy(`${BadgeModel.alias}.name`, 'ASC')
            .getMany();
        return response.render('pages/badges/index.hbs', { badges });
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private async createBadge(request: Request<any, IAssignableInput>, response: Response) {

        if (!this.assignableValidator(request.body)) {
            return BadgesRoute.renderValidationError(response, this.assignableValidator, this.badgeCreatePage.bind(this));
        }

        const badgeError = await BadgesRoute.validateAssignableInput(request.body, BadgeModel.doQuery());
        if (badgeError) {
            response.locals.error = badgeError;
            return this.badgeCreatePage(request, response);
        }

        const badge = new BadgeModel(request.body.name);

        if (request.body.tsRank) {
            const teamspeakRankError = await BadgesRoute.setTeamspeakRank(request.body.tsRank, badge, this.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return this.badgeCreatePage(request, response);
            }
        }

        await badge.save();

        return response.redirect('/badges');
    }
}
