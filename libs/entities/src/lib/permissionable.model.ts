import { IAssignableModel } from './assignable.model';
import { PermissionModel } from './permission.model';

/**
 * Used as a common type for RankModel and RoleModel
 */
export interface IPermissionableModel extends IAssignableModel {
    permissions: PermissionModel[];
}
