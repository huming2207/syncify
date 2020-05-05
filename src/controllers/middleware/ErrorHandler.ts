import { ServerRequest, ServerReply, FastifyError } from 'fastify';

export function ErrorHandler(error: FastifyError, req: ServerRequest, reply: ServerReply): void {
    req.log.error(error);
    reply.code(error.statusCode ? error.statusCode : 500).send({
        message: error.message ? error.message : 'Unknown error',
        data: {
            name: error.name ? error.name : 'Unknown',
            validation: error.validation,
        },
    });
}
