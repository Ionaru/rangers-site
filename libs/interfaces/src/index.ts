export * from './lib/interfaces';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IService {}

export interface IController<T extends IService | void, D extends IService[] = []> {
    start: (...dependencies: D) => Promise<T>;
    stop: () => Promise<void>;
}
