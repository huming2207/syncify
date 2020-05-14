import { BaseController } from '../BaseController';
import User from '../../models/UserModel';
import { ServerInstance, MiddlewareOptions, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import { NotFoundError, InternalError } from '../../common/Errors';
import argon2 from 'argon2';
import { SuccessResponseSchema } from '../../common/schemas/response/SuccessResponseSchema';
import { ErrorSchema } from '../../common/schemas/response/ErrorResponseSchema';
import { ChangePasswordSchema } from '../../common/schemas/request/UserFormSchema';

export class UserController extends BaseController {
    public bootstrap = (
        instance: ServerInstance,
        opts: MiddlewareOptions,
        done: Function,
    ): void => {
        instance.register(FastifyFormBody);
        instance.put(
            '/user/password',
            {
                schema: {
                    description: 'Change password',
                    body: ChangePasswordSchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
                },
            },
            this.changePassword,
        );
        instance.get('/user/me', {
            schema: {
                description: 'Get current user info',
                produces: ['application/json'],
                security: [{ JWT: [] }],
                response: { 200: SuccessResponseSchema, ...ErrorSchema },
            },
        });
        done();
    };

    private changePassword = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const passwordText = req.body['password'] as string;

        try {
            const user = await User.findByIdAndUpdate(userId, {
                $set: { password: await argon2.hash(passwordText) },
            });

            if (!user) {
                throw new NotFoundError('User was not found');
            }

            reply.code(200).send({
                msg: 'Password updated',
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (err) {
            throw new InternalError(`Failed to change password: ${err}`);
        }
    };

    private getUserInfo = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        try {
            const user = await User.findById(userId);
            if (!user) throw new NotFoundError('User not found');
            reply.code(200).send({
                msg: 'OK',
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (err) {
            throw new InternalError(`Failed to change password: ${err}`);
        }
    };
}
