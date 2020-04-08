import { BaseController } from './BaseController';
import { Context, Next } from 'koa';
import { Joi } from 'koa-joi-router';

export class PathController extends BaseController {
    constructor() {
        super();
        this.router.get(
            '/path',
            {
                validate: {
                    type: 'form',
                    body: {
                        path: Joi.string().min(1),
                    },
                },
            },
            this.listDirectory,
        );

        this.router.post(
            '/path',
            {
                validate: {
                    type: 'form',
                    body: {
                        name: Joi.string().min(1).max(100),
                        currPath: Joi.string().min(1),
                    },
                },
            },
            this.createDirectory,
        );

        this.router.put(
            '/path',
            {
                validate: {
                    type: 'form',
                    body: {
                        oldPath: Joi.string().min(1),
                        newPath: Joi.string().min(1),
                        move: Joi.boolean(),
                    },
                },
            },
            this.copyMoveDirectory,
        );

        this.router.delete(
            '/path',
            {
                validate: {
                    type: 'form',
                    body: {
                        path: Joi.string().min(1),
                    },
                },
            },
            this.deleteDirectory,
        );
    }

    private createDirectory = async (ctx: Context, next: Next): Promise<void> => {
        return await next();
    };

    private listDirectory = async (ctx: Context, next: Next): Promise<void> => {
        return await next();
    };

    private copyMoveDirectory = async (ctx: Context, next: Next): Promise<void> => {
        return await next();
    };

    private deleteDirectory = async (ctx: Context, next: Next): Promise<void> => {
        return await next();
    };
}
