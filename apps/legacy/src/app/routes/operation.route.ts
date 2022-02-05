import { groupArrayByObjectProperty, uniquifyObjectsArray } from '@ionaru/array-utils';
import { Request, Response } from '@ionaru/micro-web-service';
import { AttendanceModel, LOAModel, OperationModel, TeamspeakUserModel, UserModel } from '@rangers-site/entities';
import * as moment from 'moment';

import { BaseRoute } from './base.route';

interface IEvents {
    [key: string]: {
        joined: TeamspeakUserModel[];
        left: TeamspeakUserModel[];
    };
}

export class OperationRoute extends BaseRoute {

    public constructor() {
        super();
        this.createRoute('get', '/:date(\\d{4}-\\d{2}-\\d{2})', OperationRoute.operationPage);
    }

    @OperationRoute.requestDecorator(OperationRoute.checkLogin)
    private static async operationPage(request: Request, response: Response) {

        const op = await OperationModel.doQuery()
            .select(`${OperationModel.alias}.createdOn`)
            .leftJoinAndSelect(`${OperationModel.alias}.attendance`, AttendanceModel.alias)
            .leftJoinAndSelect(`${AttendanceModel.alias}.attendee`, TeamspeakUserModel.alias)
            .leftJoinAndSelect(`${TeamspeakUserModel.alias}.user`, UserModel.alias)
            .where(`DATE_FORMAT(${OperationModel.alias}.createdOn, "%Y-%m-%d") = :date`, { date: request.params.date })
            .getOne();

        if (!op) {
            return OperationRoute.sendNotFound(response, request.originalUrl);
        }

        const attendanceChecks = groupArrayByObjectProperty(
            op.attendance,
            (attendance) => moment(attendance.time).tz('Europe/Berlin').format('HH:mm'),
        );

        const events: IEvents = {};

        let first = true;
        let previous: AttendanceModel[] = [];
        for (const [time, data] of Object.entries(attendanceChecks)) {
            if (first) {
                previous = data;
                events[time] = {
                    joined: [],
                    left: [],
                };
                first = false;
                continue;
            }

            const previousAttendees = previous.map((previousAttendance) => previousAttendance.attendee.id);
            const currentAttendees = data.map((previousAttendance) => previousAttendance.attendee.id);

            const joined = data.filter((attendance) => !previousAttendees.includes(attendance.attendee.id));
            const left = previous.filter((attendance) => !currentAttendees.includes(attendance.attendee.id));

            events[time] = {
                joined: joined.map((attendance) => attendance.attendee),
                left: left.map((attendance) => attendance.attendee),
            };

            previous = data;
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const LOAs = await LOAModel.doQuery()
            .where(`loa.date = DATE_FORMAT(:opDate, "%Y-%m-%d")`, { opDate: op.createdOn })
            .getMany();

        const totalAttendance = op.attendance.map((attendance) => attendance.attendee);
        const attendees = uniquifyObjectsArray(totalAttendance, (attendee) => attendee.id);
        const users = await UserModel.find();

        return response.render('pages/operation.hbs', {
            attendees,
            events,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            LOAs,
            opDate: moment(op.createdOn).format('dddd, LL'),
            users,
        });
    }
}
