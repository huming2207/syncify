import { Context, Next } from 'koa';
import { BaseController } from '../BaseController';
import { Joi } from 'koa-joi-router';
import User from '../../models/user/UserModel';
import argon2 from 'argon2';

export class UserController extends BaseController {
    constructor() {
        super();
        this.router.post(
            '/user',
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

            return await next();
        } catch (err) {
            ctx.status = 500;
            ctx.type = 'json';
            ctx.body = { msg: 'Failed to create user', data: err };
            return await next();
        }
    };
}
