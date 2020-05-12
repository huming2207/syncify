import { BaseController } from '../BaseController';
import User from '../../models/UserModel';
import Path from '../../models/PathModel';
import { ServerInstance, MiddlewareOptions, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import {
    NotFoundError,
    BadRequestError,
    InternalError,
    UnauthorisedError,
} from '../../common/Errors';
import { PathQuerySchema } from '../../common/schemas/request/PathQuerySchema';
import { CopyMoveSchema } from '../../common/schemas/request/CopyMoveSchema';
import { traversePathTree } from '../../common/TreeTraverser';

export class PathController extends BaseController {
    public bootstrap = (
        instance: ServerInstance,
        opts: MiddlewareOptions,
        done: Function,
    ): void => {
        instance.register(FastifyFormBody);

        instance.get(
            '/path',
            {
                schema: {
                    description: 'List a directory',
                    querystring: { path: { type: 'string', pattern: '^\/' } }, // prettier-ignore
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                },
            },
            this.listDirectory,
        );

        instance.post(
            '/path',
            {
                schema: {
                    description: 'Create a directory',
                    body: PathQuerySchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                },
            },
            this.createDirectory,
        );

        instance.put(
            '/path/copy',
            {
                schema: {
                    description: 'Copy a directory',
                    body: CopyMoveSchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                },
            },
            this.copyDirectory,
        );

        instance.put(
            '/path/move',
            {
                schema: {
                    description: 'Copy a directory',
                    body: CopyMoveSchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                },
            },
            this.moveDirectory,
        );

        instance.delete(
            '/path',
            {
                schema: {
                    description: 'Delete a directory',
                    body: PathQuerySchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                },
            },
            this.deleteDirectory,
        );

        done();
    };

    private createDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const pathName = req.body['path'] as string;
        const pathToCreate = pathName.split('/').splice(1);

        // Do a BFS here to iterate a path tree.
        // If a path name is matched, set to the next iteration. If not, then create it.
        try {
            let parentPath = user.rootPath;
            for (const [idx, pathItem] of pathToCreate.entries()) {
                await parentPath.populate('childrenPath').execPopulate();
                const childPath = parentPath.childrenPath.filter(
                    (element) => element.name === pathItem,
                );

                if (childPath.length < 1) {
                    const newPath = await Path.create({ name: pathItem, owner: user, parentPath });
                    await Path.updateOne(
                        { _id: parentPath._id },
                        { $push: { childrenPath: newPath } },
                    );
                    parentPath = newPath;
                } else {
                    parentPath = childPath[0];

                    // If there is nothing created for the last item, then this path must have been created before.
                    if (idx === pathToCreate.length - 1) {
                        throw new BadRequestError('Directory already exists!');
                    }
                }
            }
        } catch (err) {
            if (!err.statusCode) throw new InternalError('Failed to create directory');
            else throw err;
        }

        reply.code(200).send({ message: 'Directory created!', data: pathToCreate });
    };

    private listDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const pathName = req.query['path'] as string;

        let parentPath = user.rootPath;

        // If it's the root directory, skip the BFS
        if (pathName !== '/') {
            // Do a BFS here to iterate a path tree.
            // If a path name is matched, continue; otherwise, return 404.
            const pathArr = pathName.split('/').splice(1);
            for (const pathItem of pathArr) {
                await parentPath.populate('childrenPath').execPopulate();
                const childPath = parentPath.childrenPath.filter(
                    (element) => element.name === pathItem,
                );

                if (childPath.length < 1) {
                    throw new NotFoundError('Directory does not exist');
                } else {
                    parentPath = childPath[0];
                }
            }
        }

        if (!parentPath) throw new NotFoundError('Directory does not exist');

        await parentPath
            .populate('owner')
            .populate('files', '_id name size type owner created updated')
            .populate('childrenPath', '_id name owner created updated')
            .execPopulate();

        reply.code(200).send({
            msg: '',
            data: {
                id: parentPath.id,
                owner: {
                    name: parentPath.owner.username,
                    email: parentPath.owner.email,
                    id: parentPath.owner._id,
                },
                files: parentPath.files,
                name: parentPath.name,
                dirs: parentPath.childrenPath,
            },
        });
    };

    private copyDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        return;
    };

    private moveDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const origPathName = req.body['orig'] as string;
        const origPath = await traversePathTree(user.rootPath, origPathName);

        const destPathName = req.body['dest'] as string;

        // If orig and dest have the same parent, then rename orig to dest (like in linux: "mv /home/xyz/foo /home/xyz/bar")
        // Or otherwise, do the real move
        const origPathParent = origPathName.substring(0, origPathName.lastIndexOf('/'));
        const destPathParent = destPathName.substring(0, destPathName.lastIndexOf('/'));
        if (origPathParent === destPathParent) {
            await Path.updateOne(origPath, {
                name: destPathName.substring(destPathName.lastIndexOf('/') + 1),
            });
            reply.code(200).send({ message: 'Directory renamed', data: null });
        } else {
            const destPath = await traversePathTree(user.rootPath, destPathName);

            // Detect original path's parent - if no parent then it can't be moved (i.e. it's root path)
            await origPath.populate('parentPath').execPopulate();
            const parentPath = origPath.parentPath;
            if (!parentPath) throw new BadRequestError('Root path cannot be moved');
            console.log(parentPath);

            // Remove orig's parent's child field
            await parentPath.populate('childrenPath').execPopulate();
            await Path.updateOne(parentPath, {
                $pull: { childrenPath: { id: origPath.id } },
            });

            // Add orig to dest
            await destPath.populate('childrenPath').execPopulate();
            await Path.updateOne(destPath, { $push: { childrenPath: origPath } });
            await Path.updateOne(origPath, { parentPath: destPath });

            reply.code(200).send({ message: 'Directory moved', data: null });
        }
    };

    private deleteDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const pathName = req.body['path'] as string;
        if (pathName === '/') throw new BadRequestError('Cannot delete root directory!');

        const currPath = await traversePathTree(user.rootPath, pathName);

        try {
            console.log(currPath);
            await currPath.remove();
            reply.code(200).send({ message: 'Directory deleted', data: null });
        } catch (err) {
            throw new InternalError('Failed to perform deletion');
        }
    };
}
