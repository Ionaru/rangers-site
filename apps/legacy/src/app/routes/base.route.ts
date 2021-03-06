import * as fs from 'fs';

import {
    BaseRouter,
    NextFunction,
    Request,
    RequestHandler,
    RequestHandlerParams,
    Response,
} from '@ionaru/micro-web-service';
import {
    EnjinTagModel,
    IAssignableModel,
    IImageableModel,
    IPermissionableModel,
    Permission,
    PermissionModel,
    TeamspeakRankModel,
    UserModel,
} from '@rangers-site/entities';
import { FileArray } from 'express-fileupload';
import { SelectQueryBuilder } from 'typeorm';

import { debug } from '../../debug';
import { EnjinService } from '../services/enjin.service';
import { TeamspeakService } from '../services/teamspeak.service';

interface IRenderData {
    [key: string]: any;
}

export class BaseRoute extends BaseRouter {

    protected static readonly debug = debug.extend('BaseRoute');

    public static checkHasPermission(user: UserModel, requiredPermission: Permission): boolean {
        const userPermissions: Permission[] = [];

        if (user.rank) {
            userPermissions.push(...user.rank.permissions.map((permission) => permission.name));
        }

        if (user.roles) {
            for (const role of user.roles) {
                userPermissions.push(...role.permissions.map((permission) => permission.name));
            }
        }

        if (userPermissions.includes(requiredPermission)) {
            return true;
        }

        BaseRoute.debug(`${user.name} does not have permission: '${requiredPermission}' in '${userPermissions}'`);

        if (process.env.RANGERS_ADMINS && user.discordUser) {
            const admins = process.env.RANGERS_ADMINS.split(',');
            if (admins.includes(user.discordUser)) {
                BaseRoute.debug(`${user.name} used admin override for permission: '${requiredPermission}'`);
                return true;
            }
        }

        return false;
    }

    protected static render(template: string, data?: IRenderData): RequestHandler | RequestHandlerParams {
        return (_request: Request, res: Response) => res.render(template, data);
    }

    protected static checkLogin(request: Request, response: Response, nextFunction: NextFunction): NextFunction | void {
        if (!request.user) {
            return response.redirect('/auth');
        }
        return nextFunction;
    }

    protected static async setPermissions(
        requestedPermissions: string[] | string | undefined, permissionable: IPermissionableModel,
    ): Promise<string | void> {

        if (!requestedPermissions) {
            permissionable.permissions = [];
            return;
        }

        if (typeof requestedPermissions === 'string') {
            requestedPermissions = [requestedPermissions];
        }

        permissionable.permissions = await PermissionModel.doQuery()
            .where(`${PermissionModel.alias}.slug IN (:slugs)`, {slugs: requestedPermissions})
            .getMany();
    }

    protected static async setTeamspeakRank(
        tsRank: unknown, assignable: IAssignableModel, teamspeak: TeamspeakService,
    ): Promise<string | void> {

        const id = Number(tsRank);

        if (isNaN(id)) {
            return 'Invalid TeamSpeak rank input.';
        }

        let teamspeakRank = await TeamspeakRankModel.findOne(id) || null;

        if (!teamspeakRank && id) {
            const ts3Rank = await teamspeak.getRank(id);

            if (!ts3Rank) {
                return 'Teamspeak rank not found.';
            }

            teamspeakRank = new TeamspeakRankModel(Number(ts3Rank.sgid), ts3Rank.name);
            await teamspeakRank.save();
        }

        assignable.teamspeakRank = teamspeakRank;
    }

    protected static async setEnjinTag(
        enjinTag: unknown, assignable: IAssignableModel, enjin: EnjinService,
    ): Promise<string | void> {

        if (!enjinTag || typeof enjinTag !== 'string' || isNaN(Number(enjinTag))) {
            return 'Invalid Enjin rank input.';
        }

        let teamspeakRank = await EnjinTagModel.findOne(enjinTag) || null;

        if (!teamspeakRank && enjinTag) {
            const tag = await enjin.getTag(enjinTag);

            if (!tag) {
                return 'Enjin rank not found.';
            }

            teamspeakRank = new EnjinTagModel(tag.tag_id, tag.tagname);
            await teamspeakRank.save();
        }

        assignable.enjinTag = teamspeakRank;
    }

    protected static async validateAssignableInput(
        requestBody: { [key: string]: unknown },
        query: SelectQueryBuilder<IAssignableModel>,
        roleId?: string,
    ): Promise<string | void> {

        if (!requestBody.name || typeof requestBody.name !== 'string') {
            return `A ${query.alias} name must be provided.`;
        }

        if (requestBody.name.length > 32) {
            return `A ${query.alias} name must be 32 characters or shorter.`;
        }

        const existingRoleQuery = query
            .where('name = :name', {name: requestBody.name});

        if (roleId) {
            existingRoleQuery.andWhere('id != :id', {id: roleId});
        }

        const existingRole = await existingRoleQuery.getOne();

        if (existingRole) {
            return `A ${query.alias} with this name already exists`;
        }
    }

    protected static async setImage(files: FileArray, imageable: IImageableModel): Promise<string | void> {

        let uploadedFile = files.image;

        if (!uploadedFile) {
            return 'Error in file input: no file found.';
        }

        if (Array.isArray(uploadedFile)) {
            uploadedFile = uploadedFile[0];
        }

        if (uploadedFile.truncated) {
            return 'Error in file input: File too big! (Max. 5MB)';
        }

        if (!['image/png', 'image/jpeg'].includes(uploadedFile.mimetype)) {
            return 'File type not supported, use .png or .jpg';
        }

        const mimeParts = uploadedFile.mimetype.split('/');
        const extension = mimeParts[mimeParts.length - 1];
        const fileName = `${Date.now()}-${uploadedFile.md5}.${extension}`;

        const basePath = 'src/assets/uploads/';

        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath);
        }

        await uploadedFile.mv(basePath + fileName);

        const oldImage = basePath + imageable.image;

        imageable.image = fileName;

        if (fs.existsSync(oldImage)) {
            fs.unlinkSync(oldImage);
        }
    }

    @BaseRoute.requestDecorator(BaseRoute.checkLogin)
    protected static async checkPermission(
        request: Request, response: Response, nextFunction: NextFunction, params: unknown[],
    ): Promise<NextFunction | (() => Response)> {

        if (!params[0] || !Object.values(Permission).includes(params[0] as any)) {
            throw new Error(`Permission ${JSON.stringify(params[0])} not found!`);
        }

        const user = request.user;
        const requiredPermission = params[0] as Permission;

        if (user && BaseRoute.checkHasPermission(user, requiredPermission)) {
            return nextFunction;
        }

        return () => BaseRoute.sendNotFound(response, request.originalUrl);
    }
}
