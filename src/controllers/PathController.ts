import { BaseController } from './BaseController';
import { Context, Next } from 'koa';
import { Joi } from 'koa-joi-router';
import User from '../models/UserModel';
import Path from '../models/PathModel';

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
                        path: Joi.string().min(1),
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
        const userId = ctx.state.user['id'];
        const user = await User.findById(userId).populate({
            path: 'rootPath',
        });

        if (user === null) {
            ctx.status = 500;
            ctx.type = 'json';
            ctx.body = { msg: 'Cannot find user', data: null };
            return next();
        }

        const body = ctx.request.body;
        const pathName = body['path'] as string;
        const pathToCreate = pathName.split('/').splice(1);

        // Do a BFS here to iterate a path tree.
        // If a path name is matched, set to the next iteration. If not, then create it.
        let parentPath = user.rootPath;
        for (const [idx, pathItem] of pathToCreate.entries()) {
            const childPath = parentPath.childrenPath.filter(
                (element) => element.name === pathItem,
            );

            if (childPath.length < 1) {
                const newPath = await Path.create({ name: pathItem, owner: user });
                await Path.updateOne({ _id: parentPath._id }, { $push: { childrenPath: newPath } });
                parentPath = newPath;
            } else {
                parentPath = childPath[0];

                // If there is nothing created for the last item, then this path must have been created before.
                if (idx === pathToCreate.length - 1) {
                    ctx.status = 400;
                    ctx.type = 'json';
                    ctx.body = { msg: 'Directory already exists!', data: null };
                    return next();
                }
            }
        }

        ctx.status = 200;
        ctx.type = 'json';
        ctx.body = { msg: 'Directory created!', data: pathToCreate };
        return next();
    };

    private listDirectory = async (ctx: Context, next: Next): Promise<void> => {
        return next();
    };

    private copyMoveDirectory = async (ctx: Context, next: Next): Promise<void> => {
        return next();
    };

    private deleteDirectory = async (ctx: Context, next: Next): Promise<void> => {
        return next();
    };
}
