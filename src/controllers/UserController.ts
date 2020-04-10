import { Context, Next } from 'koa';
import { BaseController } from './BaseController';
import { Joi } from 'koa-joi-router';
import User, { UserDoc } from '../models/UserModel';
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
                        username: Joi.string().min(2).max(100),
                        password: Joi.string().min(8).max(50),
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
                        username: Joi.string().min(2).max(100),
                        password: Joi.string().min(8).max(50),
                    },
                },
            },
            this.login,
        );

        this.router.post(
            '/user/password',
            {
                validate: {
                    type: 'form',
                    body: {
                        password: Joi.string().min(8).max(50),
                    },
                },
            },
            this.changePassword,
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

        if (user === null || !argon2.verify(user.password, passwordText)) {
            ctx.status = 401;
            ctx.type = 'json';
            ctx.body = { msg: 'Username or password is incorrect', data: null };
            return next();
        } else {
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
                process.env.SYNCIFY_JWT_SECRET ? process.env.SYNCIFY_JWT_SECRET : 'jwtTestToken',
                {
                    algorithm: 'HS512',
                    expiresIn: '1h',
                },
            );

            ctx.status = 200;
            ctx.type = 'json';
            ctx.body = {
                msg: 'User logged in sccessfully',
                data: {
                    token: token,
                },
            };
            return next();
        }
    };

    private changePassword = async (ctx: Context, next: Next): Promise<void> => {
        const userId = ctx.state.user['id'];
        const body = ctx.request.body;
        const passwordText = body['password'] as string;

        const user = await User.findByIdAndUpdate(userId, {
            $set: { password: await argon2.hash(passwordText) },
        });

        if (user === null) {
            ctx.status = 500;
            ctx.type = 'json';
            ctx.body = { msg: 'Cannot find user', data: null };
            return next();
        }

        ctx.status = 200;
        ctx.type = 'json';
        ctx.body = {
            msg: 'Password updated',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };

        return next();
    };
}
