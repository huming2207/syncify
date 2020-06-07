import { BaseController } from '../BaseController';
import { ServerInstance, MiddlewareOptions, ServerRequest, ServerReply } from 'fastify';
import fastifyJWT from 'fastify-jwt';
import { UserController } from '../endpoints/UserController';
import { FileController } from '../endpoints/FileController';
import { DirController } from '../endpoints/DirController';

export class ProtectedMiddleware extends BaseController {
    public bootstrap = (
        instance: ServerInstance,
        opts: MiddlewareOptions,
        done: () => void,
    ): void => {
        // JWT middleware starts here
        instance.register(fastifyJWT, {
            secret: process.env.PP_JWT_SECRET ? process.env.PP_JWT_SECRET : 'jwtTestToken',
            sign: {
                algorithm: 'HS512',
                expiresIn: '1h',
            },
        });

        instance.addHook('onRequest', this.onProtectedRequests);

        // Protected API (needs valid JWT)
        instance.register(new UserController().bootstrap);
        instance.register(new FileController().bootstrap);
        instance.register(new DirController().bootstrap);
        done();
    };

    private onProtectedRequests = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        try {
            await req.jwtVerify();
            const userId = (req.user as any)['id'];
            if (!userId) {
                reply.code(401).send({ message: 'Invalid JWT token' });
                return;
            }
        } catch (err) {
            reply.code(401).send({
                message: 'You are not logged in',
                data: err,
            });
        }
    };
}
