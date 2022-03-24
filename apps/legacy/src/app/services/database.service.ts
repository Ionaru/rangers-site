import { Permission, PermissionModel, SessionModel } from '@rangers-site/entities';
import { IService } from '@rangers-site/interfaces';
import { BaseEntity, Connection, In, Repository, SaveOptions } from 'typeorm';

import { debug } from '../../debug';

export class DatabaseService implements IService {

    private static readonly debug = debug.extend('DatabaseService');

    public constructor(private readonly connection: Connection) { }

    public save(entities: BaseEntity[], options?: SaveOptions): Promise<BaseEntity[]> {
        return this.connection.manager.save(entities, options);
    }

    public getSessionRepository(): Repository<SessionModel> {
        return this.connection.getRepository(SessionModel);
    }

    public async syncPermissions(): Promise<void> {
        DatabaseService.debug('Syncing permissions...');

        const existingPermissions = await PermissionModel.find();
        const changedPermissions: PermissionModel[] = [];

        const permissionSlugs = Object.keys(Permission) as Array<keyof typeof Permission>;
        for (const slug of permissionSlugs) {

            const existingPermission = existingPermissions.find((permission) => permission.slug === slug);

            if (existingPermission) {
                if (existingPermission.name !== Permission[slug]) {
                    existingPermission.name = Permission[slug];
                    changedPermissions.push(existingPermission);
                }
            } else {
                changedPermissions.push(new PermissionModel(slug, Permission[slug]));
            }
        }

        if (changedPermissions.length) {
            await this.save(changedPermissions, { reload: false });
        }

        const deletedPermissions = existingPermissions
            .filter((permission) => !permissionSlugs.includes(permission.slug))
            .map((permission) => permission.slug);

        if (deletedPermissions.length) {
            await this.connection.manager.delete(PermissionModel, {
                slug: In(deletedPermissions),
            });
        }

        DatabaseService.debug(`Permissions synced, changes: ${changedPermissions.length + deletedPermissions.length}`);
    }
}
