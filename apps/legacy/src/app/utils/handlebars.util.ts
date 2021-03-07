import { Permission, UserModel } from '@rangers-site/entities';

import { BaseRoute } from '../routes/base.route';
import HelperOptions = Handlebars.HelperOptions;

export const json = (context: Record<string, unknown>): string => JSON.stringify(context);

export const keys = (context: Record<string, unknown>): string[] => Object.keys(context);

export const values = (context: Record<string, unknown>): unknown[] => Object.values(context);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ifCond = (left: any, operator: string, right: any, o: HelperOptions): string => {
    switch (operator) {
        case 'streq':
            return left.toString() === right.toString() ? o.fn(undefined) : o.inverse(undefined);
        case '===':
            return left === right ? o.fn(undefined) : o.inverse(undefined);
        case '<':
            return left < right ? o.fn(undefined) : o.inverse(undefined);
        case '>':
            return left > right ? o.fn(undefined) : o.inverse(undefined);
        default:
            throw new Error(`Not implemented: ifCond (${operator})`);
    }
};

export const hasPermission = (user: UserModel | undefined, permissionSlug: keyof typeof Permission, o: HelperOptions): string => {

    if (user && BaseRoute.checkHasPermission(user, Permission[permissionSlug])) {
        return o.fn(undefined);
    }

    return o.inverse(undefined);
};
