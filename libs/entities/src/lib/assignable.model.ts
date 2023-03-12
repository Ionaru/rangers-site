import { BaseModel } from './base.model';
import { TeamspeakRankModel } from './teamspeak-rank.model';
import { UserModel } from './user.model';

/**
 * Used as a common type for BadgeModel, RankModel and RoleModel
 */
export interface IAssignableModel extends BaseModel {
    name: string;
    users: UserModel[];
    teamspeakRank?: TeamspeakRankModel | null;
}
