import { Request, Response } from '@ionaru/micro-web-service';
import { BadgeModel, EnjinTagModel, Permission, TeamspeakRankModel } from '@rangers-site/entities';
import { DefinedError } from 'ajv';

import { EnjinService } from '../services/enjin.service';
import { TeamspeakService } from '../services/teamspeak.service';

import { BaseRoute, IAssignableInput } from './base.route';

export class BadgesRoute extends BaseRoute {

    private static teamspeak: TeamspeakService;
    private static enjin: EnjinService;

    public constructor(teamSpeak: TeamspeakService, enjin: EnjinService) {
        super();
        BadgesRoute.teamspeak = teamSpeak;
        BadgesRoute.enjin = enjin;
        this.createRoute('get', '/', BadgesRoute.badgesPage);

        this.createRoute('get', '/create', BadgesRoute.badgeCreatePage);
        this.createRoute('post', '/create', this.createBadge.bind(this));

        this.createRoute('get', '/edit/:id', BadgesRoute.badgeEditPage);
        this.createRoute('post', '/edit/:id', this.editBadge.bind(this));

        this.createRoute('get', '/delete/:id', BadgesRoute.badgeDeletePage);
        this.createRoute('post', '/delete/:id', BadgesRoute.deleteBadge);
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private async editBadge(request: Request<any, IAssignableInput>, response: Response) {

        if (!this.assignableValidator(request.body)) {
            response.locals.error = (this.assignableValidator.errors as DefinedError[]).join(', ');
            return BadgesRoute.badgeEditPage(request, response);
        }

        const badgeError = await BadgesRoute.validateAssignableInput(request.body, BadgeModel.doQuery(), request.params.id);
        if (badgeError) {
            response.locals.error = badgeError;
            return BadgesRoute.badgeEditPage(request, response);
        }

        const badge = await BadgeModel.findOne(request.params.id);

        if (!badge) {
            return BadgesRoute.sendNotFound(response, request.originalUrl);
        }

        badge.name = request.body.name;

        if (request.body.tsRank) {
            const teamspeakRankError = await BadgesRoute.setTeamspeakRank(request.body.tsRank, badge, BadgesRoute.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return BadgesRoute.badgeEditPage(request, response);
            }
        } else {
            badge.teamspeakRank = null;
        }

        if (request.body.enjinTag) {
            const enjinRankError = await BadgesRoute.setEnjinTag(request.body.enjinTag, badge, BadgesRoute.enjin);
            if (enjinRankError) {
                response.locals.error = enjinRankError;
                return BadgesRoute.badgeEditPage(request, response);
            }
        } else {
            badge.enjinTag = null;
        }

        await badge.save();

        return response.redirect('/badges');
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private static async badgeEditPage(request: Request<{id: number}>, response: Response) {
        const badge = await BadgeModel.findOne(request.params.id, { relations: ['teamspeakRank', 'enjinTag'] });

        if (!badge) {
            return BadgesRoute.sendNotFound(response, request.originalUrl);
        }

        const enjinTags = await BadgesRoute.enjin.getTags();
        const tsRanks = await BadgesRoute.teamspeak.getRanks();

        return response.render('pages/badges/edit.hbs', { badge, enjinTags, tsRanks });
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private static async badgeDeletePage(request: Request<{id: number}>, response: Response) {
        const badge = await BadgeModel.findOne(request.params.id);

        if (!badge) {
            return BadgesRoute.sendNotFound(response, request.originalUrl);
        }

        return response.render('pages/badges/delete.hbs', { badge });
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private static async deleteBadge(request: Request<{id: number}>, response: Response) {
        const badge = await BadgeModel.findOne(request.params.id, { relations: ['users'] });

        if (!badge) {
            return BadgesRoute.sendNotFound(response, request.originalUrl);
        }

        if (badge.users.length) {
            response.locals.error = 'Cannot delete a badge that is still in use.';
            return BadgesRoute.badgeDeletePage(request, response);
        }

        await badge.remove();

        return response.redirect('/badges');
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private static async badgeCreatePage(_request: Request, response: Response) {
        const enjinTags = await BadgesRoute.enjin.getTags();
        const tsRanks = await BadgesRoute.teamspeak.getRanks();

        return response.render('pages/badges/create.hbs', { enjinTags, tsRanks });
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkLogin)
    private static async badgesPage(_request: Request, response: Response) {
        const badges = await BadgeModel.doQuery()
            .leftJoinAndSelect(`${BadgeModel.alias}.teamspeakRank`, TeamspeakRankModel.alias)
            .leftJoinAndSelect(`${BadgeModel.alias}.enjinTag`, EnjinTagModel.alias)
            .orderBy(`${BadgeModel.alias}.name`, 'ASC')
            .getMany();
        return response.render('pages/badges/index.hbs', { badges });
    }

    @BadgesRoute.requestDecorator(BadgesRoute.checkPermission, Permission.EDIT_BADGES)
    private async createBadge(request: Request<any, IAssignableInput>, response: Response) {

        if (!this.assignableValidator(request.body)) {
            response.locals.error = this.assignableValidator.errors as DefinedError[];
            return BadgesRoute.badgeCreatePage(request, response);
        }

        const badgeError = await BadgesRoute.validateAssignableInput(request.body, BadgeModel.doQuery());
        if (badgeError) {
            response.locals.error = badgeError;
            return BadgesRoute.badgeCreatePage(request, response);
        }

        const badge = new BadgeModel(request.body.name);

        if (request.body.tsRank) {
            const teamspeakRankError = await BadgesRoute.setTeamspeakRank(request.body.tsRank, badge, BadgesRoute.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return BadgesRoute.badgeCreatePage(request, response);
            }
        }

        if (request.body.enjinTag) {
            const enjinRankError = await BadgesRoute.setEnjinTag(request.body.enjinTag, badge, BadgesRoute.enjin);
            if (enjinRankError) {
                response.locals.error = enjinRankError;
                return BadgesRoute.badgeCreatePage(request, response);
            }
        }

        await badge.save();

        return response.redirect('/badges');
    }
}
