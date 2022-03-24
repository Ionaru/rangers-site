export * from './lib/interfaces';

export interface IService {}

export interface IController<T extends IService | void, D extends IService[] = []> {
    start: (...dependencies: D) => Promise<T>;
    stop: () => Promise<void>;
}
