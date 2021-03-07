import 'express-session';
import { UserModel } from '@rangers-site/entities';

declare global {
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-empty-interface
        interface User extends UserModel {
        }
    }
}
