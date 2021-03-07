import { Column, Entity, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';

export enum Permission {
    READ_OPERATIONS_ACTIVITY = 'Read operations activity',
    EDIT_USER_RANK = 'Edit user rank',
    EDIT_USER_ROLE = 'Edit user roles',
    EDIT_USER_BADGE = 'Edit user badges',
    EDIT_RANKS = 'Edit ranks',
    EDIT_ROLES = 'Edit roles',
    EDIT_BADGES = 'Edit badges',
}

@Entity({
    name: PermissionModel.alias,
})
export class PermissionModel extends BaseModel {

    public static alias = 'permission';

    @Column({
        type: 'varchar',
        unique: true,
    })
    public slug!: keyof typeof Permission;

    @Column()
    public name!: Permission;

    public constructor(slug: keyof typeof Permission, name: Permission) {
        super();
        this.slug = slug;
        this.name = name;
    }

    public static doQuery(): SelectQueryBuilder<PermissionModel> {
        return PermissionModel.createQueryBuilder(PermissionModel.alias);
    }

    public static async syncPermissions(): Promise<void> {
        for (const key of Object.keys(Permission)) {
            const slug = key as keyof typeof Permission;

            let existingPermission = await PermissionModel.findOne({slug});

            if (existingPermission) {
                existingPermission.name = Permission[slug];
            } else {
                existingPermission = new PermissionModel(slug, Permission[slug]);
            }

            await existingPermission.save();
        }

        const permissions = await PermissionModel.find();
        const deletedPermissions = permissions.filter((permission) => !(permission.slug in Permission));

        await Promise.all(deletedPermissions.map((permission) => permission.remove()));
    }
}
