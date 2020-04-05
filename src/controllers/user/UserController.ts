import { Context, Next } from 'koa';
import { BaseController } from '../BaseController';
import { Joi } from 'koa-joi-router';
import User, { UserDoc } from '../../models/user/UserModel';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

export class UserController extends BaseController {
    constructor() {
        super();
        this.router.post(
            '/user/register',
            {
                validate: {
                    type: 'form',
                    body: {
                        username: Joi.string().max(50),
                        password: Joi.string().max(50),
                        email: Joi.string().email(),
                    },
                },
            },
            this.createUser,
        );

        this.router.post(
            '/user/login',
            {
                validate: {
                    type: 'form',
                    body: {
                        username: Joi.string().max(100),
                        password: Joi.string().max(50),
                    },
                },
            },
            this.login,
        );
    }

    private createUser = async (ctx: Context, next: Next): Promise<void> => {
        const body = ctx.request.body;
        const userName = body['username'];
        const passwordText = body['password'];
        const email = body['email'];

        try {
            const createdUser = await User.create({
                username: userName,
                password: await argon2.hash(passwordText),
                email: email,
            });

            ctx.status = 200;
            ctx.type = 'json';
            ctx.body = {
                msg: 'User created',
                data: {
                    id: createdUser.id,
                    username: createdUser.username,
                    email: createdUser.email,
                },
            };

            return next();
        } catch (err) {
            ctx.status = 400;
            ctx.type = 'json';
            ctx.body = { msg: 'Failed to create user', data: err };
            return next();
        }
    };

    private login = async (ctx: Context, next: Next): Promise<void> => {
        const body = ctx.request.body;
        const userName = body['username'];
        const passwordText = body['password'];

        let user: UserDoc | null;
        try {
            user = await User.findOne({ $or: [{ username: userName }, { email: userName }] });
        } catch (err) {
            ctx.status = 400;
            ctx.type = 'json';
            ctx.body = { msg: 'Failed to query user', data: err };
            return next();
        }

        if (user === null || argon2.verify(user.password, passwordText)) {
            ctx.status = 401;
            ctx.type = 'json';
            ctx.body = { msg: 'Username or password is incorrect', data: null };
            return next();
        } else {
            jwt.sign(
                {
                    username: user.username,
                    id: user.id,
                    email: user.email,
                },
                process.env.SYNCIFY_JWT_SECRET ? process.env.SYNCIFY_JWT_SECRET : 'jwtTestToken',
                {
                    algorithm: 'HS512',
                },
            );
        }
    };
}
