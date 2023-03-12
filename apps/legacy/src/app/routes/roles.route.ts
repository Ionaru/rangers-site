import { Request, Response } from '@ionaru/micro-web-service';
import { Permission, RoleModel, TeamspeakRankModel } from '@rangers-site/entities';

import { DiscordService } from '../services/discord.service';
import { TeamspeakService } from '../services/teamspeak.service';

import { BaseRoute, IPermissionableInput } from './base.route';

export class RolesRoute extends BaseRoute {

    public constructor(
        private readonly teamspeak: TeamspeakService,
        private readonly discord: DiscordService,
    ) {
        super();
        this.createRoute('get', '/', this.rolesPage.bind(this));

        this.createRoute('get', '/create', this.roleCreatePage.bind(this));
        this.createRoute('post', '/create', this.createRole.bind(this));

        this.createRoute('get', '/edit/:id', this.roleEditPage.bind(this));
        this.createRoute('post', '/edit/:id', this.editRole.bind(this));

        this.createRoute('get', '/delete/:id', this.roleDeletePage.bind(this));
        this.createRoute('post', '/delete/:id', this.deleteRole.bind(this));
    }

    @RolesRoute.requestDecorator(RolesRoute.checkPermission, Permission.EDIT_ROLES)
    private async editRole(request: Request<any, IPermissionableInput>, response: Response) {

        if (!this.permissionableValidator(request.body)) {
            return RolesRoute.renderValidationError(response, this.permissionableValidator, this.roleEditPage.bind(this));
        }

        const roleError = await RolesRoute.validateAssignableInput(request.body, RoleModel.doQuery(), request.params.id);
        if (roleError) {
            response.locals.error = roleError;
            return this.roleEditPage(request, response);
        }

        const role = await RoleModel.findOne(request.params.id);

        if (!role) {
            return RolesRoute.sendNotFound(response, request.originalUrl);
        }

        role.name = request.body.name;

        if (request.body.tsRank) {
            const teamspeakRankError = await RolesRoute.setTeamspeakRank(request.body.tsRank, role, this.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return this.roleEditPage(request, response);
            }
        } else {
            role.teamspeakRank = null;
        }

        if (request.body.discordRole) {
            const discordRoleError = await RolesRoute.setDiscordRole(request.body.discordRole, role, this.discord);
            if (discordRoleError) {
                response.locals.error = discordRoleError;
                return this.roleEditPage(request, response);
            }
        } else {
            role.discordRole = null;
        }

        const permissionsError = await RolesRoute.setPermissions(request.body.permissions, role);
        if (permissionsError) {
            response.locals.error = permissionsError;
            return this.roleEditPage(request, response);
        }

        await role.save();

        return response.redirect('/roles');
    }

    @RolesRoute.requestDecorator(RolesRoute.checkPermission, Permission.EDIT_ROLES)
    private async roleEditPage(request: Request<{ id: number; }>, response: Response) {
        const role = await RoleModel.findOne(request.params.id, { relations: ['teamspeakRank'] });

        if (!role) {
            return RolesRoute.sendNotFound(response, request.originalUrl);
        }

        const discordRoles = await this.discord.getRolesInServer();
        const tsRanks = await this.teamspeak.getRanks();
        const permissions = Object.entries(Permission).map((permissionEntry) => ({
            name: permissionEntry[1],
            slug: permissionEntry[0],
        }));

        return response.render('pages/roles/edit.hbs', { discordRoles, permissions, role, tsRanks });
    }

    @RolesRoute.requestDecorator(RolesRoute.checkPermission, Permission.EDIT_ROLES)
    private async roleDeletePage(request: Request<{ id: number; }>, response: Response) {
        const role = await RoleModel.findOne(request.params.id);

        if (!role) {
            return RolesRoute.sendNotFound(response, request.originalUrl);
        }

        return response.render('pages/roles/delete.hbs', { role });
    }

    @RolesRoute.requestDecorator(RolesRoute.checkPermission, Permission.EDIT_ROLES)
    private async deleteRole(request: Request<{ id: number; }>, response: Response) {
        const role = await RoleModel.findOne(request.params.id, { relations: ['users'] });

        if (!role) {
            return RolesRoute.sendNotFound(response, request.originalUrl);
        }

        if (role.users.length) {
            response.locals.error = 'Cannot delete a role that is still in use.';
            return this.roleDeletePage(request, response);
        }

        await role.remove();

        return response.redirect('/roles');
    }

    @RolesRoute.requestDecorator(RolesRoute.checkPermission, Permission.EDIT_ROLES)
    private async roleCreatePage(_request: Request, response: Response) {
        const tsRanks = await this.teamspeak.getRanks();
        const permissions = Object.entries(Permission).map((permissionEntry) => ({
            name: permissionEntry[1],
            slug: permissionEntry[0],
        }));
        return response.render('pages/roles/create.hbs', { permissions, tsRanks });
    }

    @RolesRoute.requestDecorator(RolesRoute.checkLogin)
    private async rolesPage(_request: Request, response: Response) {
        const discordRoles = await this.discord.getRolesInServer();
        const tsRanks = await this.teamspeak.getRanks();
        const roles = await RoleModel.doQuery()
            .leftJoinAndSelect(`${RoleModel.alias}.teamspeakRank`, TeamspeakRankModel.alias)
            .orderBy(`${RoleModel.alias}.name`, 'ASC')
            .getMany();
        return response.render('pages/roles/index.hbs', { discordRoles, roles, tsRanks });
    }

    @RolesRoute.requestDecorator(RolesRoute.checkPermission, Permission.EDIT_ROLES)
    private async createRole(request: Request<any, IPermissionableInput>, response: Response) {

        if (!this.permissionableValidator(request.body)) {
            return RolesRoute.renderValidationError(response, this.permissionableValidator, this.roleCreatePage.bind(this));
        }

        const roleError = await RolesRoute.validateAssignableInput(request.body, RoleModel.doQuery());
        if (roleError) {
            response.locals.error = roleError;
            return this.roleCreatePage(request, response);
        }

        const role = new RoleModel(request.body.name);

        if (request.body.tsRank) {
            const teamspeakRankError = await RolesRoute.setTeamspeakRank(request.body.tsRank, role, this.teamspeak);
            if (teamspeakRankError) {
                response.locals.error = teamspeakRankError;
                return this.roleCreatePage(request, response);
            }
        }

        const permissionsError = await RolesRoute.setPermissions(request.body.permissions, role);
        if (permissionsError) {
            response.locals.error = permissionsError;
            return this.roleEditPage(request, response);
        }

        await role.save();

        return response.redirect('/roles');
    }
}
