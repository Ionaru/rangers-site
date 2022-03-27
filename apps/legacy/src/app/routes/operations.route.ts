import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { Request, Response } from '@ionaru/micro-web-service';
import {
    AttendanceModel,
    LOAModel,
    OperationModel,
    Permission,
    TeamspeakUserModel,
    UserModel,
} from '@rangers-site/entities';

import { BaseRoute } from './base.route';

interface IActivity {
    attendeeId: number;
    lastJoined: string;
    ts3Name: string;
    uuid: string;
    name?: string;
}

export class OperationsRoute extends BaseRoute {

    public constructor() {
        super();
        this.createRoute('get', '/', this.operationPage.bind(this));
        this.createRoute('get', '/activity', this.activityPage.bind(this));
    }

    @OperationsRoute.requestDecorator(OperationsRoute.checkPermission, Permission.READ_OPERATIONS_ACTIVITY)
    private async activityPage(_request: Request, response: Response) {

        const activity = (await AttendanceModel.doQuery()
            .select([
                `DISTINCT ${AttendanceModel.alias}.attendeeId`,
                `DATE_FORMAT(max(${AttendanceModel.alias}.time), "%Y-%m-%d") as lastJoined`,
                `${TeamspeakUserModel.alias}.nickname as ts3Name`,
                `${UserModel.alias}.uuid as uuid`,
                `${UserModel.alias}.name as name`,
            ])
            .leftJoin(`${AttendanceModel.alias}.attendee`, TeamspeakUserModel.alias)
            .leftJoin(`${TeamspeakUserModel.alias}.user`, UserModel.alias)
            .groupBy(`${AttendanceModel.alias}.attendeeId`)
            .getRawMany())
            .map((a: IActivity) => ({
                ...a,
                name: a.name || '',
            }));

        sortArrayByObjectProperty(activity, (a) => a.name);
        sortArrayByObjectProperty(activity, (a) => a.ts3Name);
        sortArrayByObjectProperty(activity, (a) => a.lastJoined, true);

        return response.render('pages/activity.hbs', { activity });
    }

    @OperationsRoute.requestDecorator(OperationsRoute.checkPermission, Permission.READ_OPERATIONS_ACTIVITY)
    private async operationPage(_request: Request, response: Response) {
        const ops = await OperationModel.doQuery()
            .select([
                `COUNT(DISTINCT(${AttendanceModel.alias}.attendeeId)) as playerCount`,
                `DATE_FORMAT(${OperationModel.alias}.createdOn, "%Y-%m-%d") as date`,
                `COUNT(DISTINCT(${LOAModel.alias}.id)) as loas`,
            ])
            .leftJoin(AttendanceModel, AttendanceModel.alias, `${OperationModel.alias}.id = ${AttendanceModel.alias}.operationId`)
            .leftJoin(LOAModel, LOAModel.alias, `DATE_FORMAT(${OperationModel.alias}.createdOn, "%Y-%m-%d") = loa.date`)
            .groupBy(`${OperationModel.alias}.id`)
            .orderBy('date', 'DESC')
            .getRawMany();

        return response.render('pages/operations.hbs', { ops });
    }
}
