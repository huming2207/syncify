import { BaseController } from '../BaseController';
import User from '../../models/UserModel';
import Path from '../../models/PathModel';
import { ServerInstance, MiddlewareOptions, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import { NotFoundError, BadRequestError, InternalError } from '../../common/Errors';
import { PathQuerySchema } from '../../common/schemas/PathQuerySchema';

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
            '/path',
            {
                schema: {
                    description: 'Move or copy a directory',
                    body: {
                        type: 'object',
                        properties: {
                            oldPath: { type: 'string', pattern: '^\/' }, // prettier-ignore
                            newPath: { type: 'string', pattern: '^\/' }, // prettier-ignore
                            move: { type: 'boolean' },
                        },
                    },
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                },
            },
            this.copyMoveDirectory,
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
        if (!user) throw new NotFoundError('Cannot load current user');
        const pathName = req.body['path'] as string;
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
                    throw new BadRequestError('Directory already exists!');
                }
            }
        }

        reply.code(200).send({ message: 'Directory created!', data: pathToCreate });
    };

    private listDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Cannot load current user');
        const pathName = req.query['path'] as string;
        const pathArr = pathName.split('/').splice(1);

        // Do a BFS here to iterate a path tree.
        // If a path name is matched, continue; otherwise, return 404.
        let parentPath = user.rootPath;
        for (const pathItem of pathArr) {
            const childPath = parentPath.childrenPath.filter(
                (element) => element.name === pathItem,
            );

            if (childPath.length < 1) {
                throw new NotFoundError('Directory does not exist');
            } else {
                parentPath = childPath[0];
            }
        }

        await parentPath.populate('owner').populate('files').execPopulate();

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

    private copyMoveDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        return;
    };

    private deleteDirectory = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Cannot load current user');
        const pathName = req.body['path'] as string;
        const pathArr = pathName.split('/').splice(1);

        // Do a BFS here to iterate a path tree.
        // If a path name is matched, continue; otherwise, return 404.
        let currPath = user.rootPath;
        for (const pathItem of pathArr) {
            const childPath = currPath.childrenPath.filter((element) => element.name === pathItem);

            if (childPath.length < 1) {
                throw new NotFoundError('Directory does not exist');
            } else {
                currPath = childPath[0];
            }
        }

        try {
            await currPath.remove();
            reply.code(200).send({ message: 'Directory deleted', data: null });
        } catch (err) {
            throw new InternalError('Failed to perform deletion');
        }
    };
}
