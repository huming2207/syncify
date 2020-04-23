import { ServerInstance, MiddlewareOptions } from 'fastify';

export abstract class BaseController {
    public abstract bootstrap(
        instance: ServerInstance,
        opts: MiddlewareOptions,
        done: Function,
    ): void;
}
