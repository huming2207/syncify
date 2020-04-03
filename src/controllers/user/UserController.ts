import { Context, Next } from 'koa';
import { BaseController } from '../BaseController';
import { Joi } from 'koa-joi-router';

export class UserController extends BaseController {
    constructor() {
        super('/user');
        this.router.post('', {
            validate: {
                body: {
                    username: Joi.string().max(50),
                    password: Joi.string().max(50),
                    email: Joi.string().email(),
                },
            },
        });
    }

    private createUser = async (ctx: Context, next: Next): Promise<void> => {
        const body = ctx.request.body;
        const userName = body['username'];
        const passwordText = body['password'];
        const email = body['email'];
        
        
    }
}