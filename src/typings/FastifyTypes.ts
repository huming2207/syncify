import http from 'http';
import fastify from 'fastify';

declare module 'fastify' {
    export type ServerInstance = fastify.FastifyInstance<
        http.Server,
        http.IncomingMessage,
        http.ServerResponse
    >;

    export type ServerRequest = fastify.FastifyRequest;
    export type MiddlewareOptions = RegisterOptions<
        http.Server,
        http.IncomingMessage,
        http.ServerResponse
    >;

    export type ServerReply = fastify.FastifyReply<http.ServerResponse>;
    export type ServerPlugin = Plugin<
        http.Server,
        http.IncomingMessage,
        http.ServerResponse,
        MiddlewareOptions,
        () => void
    >;
}
