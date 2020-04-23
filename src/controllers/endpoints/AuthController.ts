import { BaseController } from '../BaseController';
import { ServerInstance, MiddlewareOptions, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import User, { UserDoc } from '../../models/UserModel';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

export class AuthController extends BaseController {
    public bootstrap = (
        instance: ServerInstance,
        opts: MiddlewareOptions,
        done: Function,
    ): void => {
        instance.register(FastifyFormBody);

        instance.addSchema({
            $id: '#userRegForm',
            type: 'object',
            properties: {
                username: { type: 'string', minLength: 3, maxLength: 60 },
                password: { type: 'string', minLength: 8, maxLength: 20 },
                email: { type: 'string', format: 'email' },
            },
            required: ['username', 'password'],
        });

        instance.post(
            '/auth/register',
            {
                schema: {
                    body: { $ref: '#userRegForm' },
                },
            },
            this.register,
        );

        instance.post(
            '/auth/login',
            {
                schema: {
                    body: { $ref: '#userRegForm' },
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

        try {
            const createdUser = await User.create({
                username,
                password: await argon2.hash(password),
                email,
            });

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
            if (user === null || !argon2.verify(user.password, password)) throw new Error();

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
            reply.code(401).send({
                message: 'Username or password is incorrect, try again',
                data: null,
            });
        }
    };
}
