import 'express-session';

declare module 'express-session' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface SessionData {
        user?: string;
    }
}
