import { IAssignableModel } from './assignable.model';

/**
 * Used as a common type for RankModel and BadgeModel
 */
export interface IImageableModel extends IAssignableModel {
    image?: string | null;
}
