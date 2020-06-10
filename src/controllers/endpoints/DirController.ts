import { BaseController } from '../BaseController';
import User, { UserDoc } from '../../models/UserModel';
import Directory, { DirDoc } from '../../models/DirModel';
import { ServerInstance, MiddlewareOptions, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import {
    NotFoundError,
    BadRequestError,
    InternalError,
    UnauthorisedError,
} from '../../common/Errors';
import { DirQuerySchema } from '../../common/schemas/request/DirQuerySchema';
import { CopyMoveSchema } from '../../common/schemas/request/CopyMoveSchema';
import { traversePathTree } from '../../common/TreeTraverser';
import { SuccessResponseSchema } from '../../common/schemas/response/SuccessResponseSchema';
import { ErrorSchema } from '../../common/schemas/response/ErrorResponseSchema';
import { RenameSchema } from '../../common/schemas/request/RenameSchema';

export class DirController extends BaseController {
    public bootstrap = (
        instance: ServerInstance,
        opts: MiddlewareOptions,
        done: () => void,
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
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
                },
            },
            this.listDirectory,
        );

        instance.post(
            '/path',
            {
                schema: {
                    description: 'Create a directory',
                    body: DirQuerySchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
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
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
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
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
                },
            },
            this.moveDirectory,
        );

        instance.put(
            '/path/rename',
            {
                schema: {
                    description: 'Rename a directory',
                    body: RenameSchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
                },
            },
            this.renameDirectory,
        );

        instance.delete(
            '/path',
            {
                schema: {
                    description: 'Delete a directory',
                    body: DirQuerySchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
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
            let parent = user.rootDir;
            for (const [idx, pathItem] of pathToCreate.entries()) {
                await parent.populate('children').execPopulate();
                const childPath = parent.children.filter((element) => element.name === pathItem);

                if (childPath.length < 1) {
                    const newPath = await Directory.create<{
                        name: string;
                        owner: UserDoc;
                        parent: DirDoc;
                    }>({ name: pathItem, owner: user, parent });
                    await Directory.updateOne(
                        { _id: parent._id },
                        { $push: { children: newPath } },
                    );
                    parent = newPath;
                } else {
                    parent = childPath[0];

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
        const path = await traversePathTree(user.rootDir, pathName);

        if (!path) throw new NotFoundError('Directory does not exist');

        await path
            .populate('owner')
            .populate('files', '_id name size type owner created updated')
            .populate('children', '_id name owner created updated')
            .execPopulate();

        reply.code(200).send({
            msg: '',
            data: {
                id: path.id,
                owner: {
                    name: path.owner.username,
                    email: path.owner.email,
                    id: path.owner._id,
                },
                files: path.files,
                name: path.name,
                dirs: path.children,
            },
        });
    };

    private copyDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        return;
    };

    private renameDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const pathStr = req.body['item'] as string;
        const newName = req.body['name'] as string;
        const currPath = await traversePathTree(user.rootDir, pathStr);

        try {
            await Directory.updateOne(currPath, { name: newName });
            reply.code(200).send({ message: 'Directory renamed', data: {} });
        } catch (err) {
            throw new InternalError('Failed to rename directory');
        }
    };

    private moveDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const origPathName = req.body['orig'] as string;
        const origPath = await traversePathTree(user.rootDir, origPathName);

        const destPathName = req.body['dest'] as string;
        const destPath = await traversePathTree(user.rootDir, destPathName);

        try {
            // Detect original path's parent - if no parent then it can't be moved (i.e. it's root path)
            await origPath.populate('parent').execPopulate();
            const parent = origPath.parent;
            if (!parent) throw new BadRequestError('Root path cannot be moved');
            console.log(parent);

            // Remove orig's parent's child field
            await Directory.updateOne(parent, {
                $pull: { children: origPath._id },
            });

            // Add orig to dest
            await Directory.updateOne(destPath, { $push: { children: origPath._id } });
            await Directory.updateOne(origPath, { parent: destPath });

            reply.code(200).send({ message: 'Directory moved', data: {} });
        } catch (err) {
            throw new InternalError('Failed to move a file');
        }
    };

    private deleteDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const pathName = req.body['path'] as string;
        if (pathName === '/') throw new BadRequestError('Cannot delete root directory!');

        const currPath = await traversePathTree(user.rootDir, pathName);

        try {
            console.log(currPath);
            await currPath.remove();
            reply.code(200).send({ message: 'Directory deleted', data: {} });
        } catch (err) {
            throw new InternalError('Failed to perform deletion');
        }
    };
}
