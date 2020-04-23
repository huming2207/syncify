import { BaseController } from '../BaseController';
import { ServerInstance, MiddlewareOptions, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import User, { UserDoc } from '../../models/UserModel';
import Path from '../../models/PathModel';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { InternalError, UnauthorisedError } from '../../common/Errors';
import { UserFormSchema } from '../../common/schemas/UserFormSchema';

export class AuthController extends BaseController {
    public bootstrap = (
        instance: ServerInstance,
        opts: MiddlewareOptions,
        done: Function,
    ): void => {
        instance.register(FastifyFormBody);
        instance.post(
            '/auth/register',
            {
                schema: {
                    body: UserFormSchema,
                },
            },
            this.register,
        );

        instance.post(
            '/auth/login',
            {
                schema: {
                    body: UserFormSchema,
                },
            },
            this.login,
        );
        done();
    };

    private register = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const username = req.body['username'] as string;
        const password = req.body['password'] as string;
        const email = req.body['email'] as string;

        const createdUser = await User.create({
            username,
            password: await argon2.hash(password),
            email,
        });

        if (!createdUser) throw new InternalError('Failed to create user');

        const createdPath = await Path.create({
            owner: createdUser,
            name: '',
        });

        if (!createdPath) throw new InternalError('Failed to create root path');

        try {
            createdUser.rootPath = createdPath;
            await createdUser.save();

            reply.code(200).send({
                message: 'User created',
                data: {
                    userName: createdUser.username,
                    email: createdUser.email,
                    id: createdUser.id,
                },
            });
        } catch (err) {
            reply.code(500).send({
                message: 'Failed to create user',
                data: err,
            });
        }
    };

    private login = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const username = req.body['username'] as string;
        const password = req.body['password'] as string;

        let user: UserDoc | null;
        try {
            user = await User.findOne({ $or: [{ username }, { email: username }] });
            if (!user || !argon2.verify(user.password, password)) {
                throw new UnauthorisedError('Username or password is incorrect, try again');
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
                process.env.PP_JWT_SECRET ? process.env.PP_JWT_SECRET : 'jwtTestToken',
                {
                    algorithm: 'HS512',
                    expiresIn: '1h',
                },
            );

            reply.code(200).send({
                message: 'Done',
                data: { token },
            });
        } catch (err) {
            throw new UnauthorisedError('Username or password is incorrect, try again');
        }
    };
}
