import { BaseController } from '../BaseController';
import { MiddlewareOptions, ServerInstance, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import FastifyMultipart from 'fastify-multipart';
import mongodb from 'mongodb';
import File from '../../models/FileModel';
import User from '../../models/UserModel';
import Path from '../../models/PathModel';
import { NotFoundError, BadRequestError, InternalError } from '../../common/Errors';
import { Readable } from 'stream';
import StreamMeter from 'stream-meter';
import { StorageService, StorageBucketName } from '../../services/storage/StorageService';

export class FileController extends BaseController {
    private storage: StorageService = StorageService.getInstance();
    public bootstrap = (
        instance: ServerInstance,
        opts: MiddlewareOptions,
        done: Function,
    ): void => {
        instance.register(FastifyFormBody);
        instance.get(
            '/file',
            {
                schema: {
                    description: 'Provide a file path to get a file',
                    querystring: {
                        type: 'object',
                        properties: {
                            file: { type: 'string', pattern: '^\/' } // prettier-ignore
                        },
                    },
                    security: [{ JWT: [] }],
                },
            },
            this.getFile,
        );

        instance.put(
            '/file',
            {
                schema: {
                    description: 'Move a file from an old path to a new path',
                    body: {
                        type: 'object',
                        properties: {
                            old: { type: 'string', pattern: '^\//' }, // prettier-ignore
                            new: { type: 'string', pattern: '^\/' } // prettier-ignore
                        },
                    },
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                },
            },
            this.moveFile,
        );

        instance.delete(
            '/file',
            {
                schema: {
                    description: 'Delete a file based on the path provided',
                    body: {
                        type: 'object',
                        properties: {
                            file: { type: 'string', pattern: '^\/' } // prettier-ignore
                        },
                    },
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                },
            },
            this.removeFile,
        );

        instance.register(FastifyMultipart);
        instance.post('/file', this.uploadFile);

        done();
    };

    private getFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Failed to find the user');

        const path = req.query['path'] as string;
        const pathArr = path.split('/').splice(1);

        // Do a BFS here to iterate a path tree.
        // If a path name is matched, continue; otherwise, return 404.
        let currPath = user.rootPath;
        let fileName = '';
        for (const [idx, pathItem] of pathArr.entries()) {
            await currPath.populate('childrenPath').execPopulate();
            const childPath = currPath.childrenPath.filter((element) => element.name === pathItem);
            if (idx === pathArr.length - 1) {
                fileName = pathItem;
                break;
            }

            if (childPath.length < 1) {
                throw new NotFoundError('Directory does not exist');
            } else {
                currPath = childPath[0];
            }
        }

        // Load files from the directory it should be in
        await currPath.populate('files').execPopulate();

        // Load file
        const files = currPath.files.filter((element) => element.name === fileName);
        if (files.length < 1) {
            throw new NotFoundError('File does not exist');
        }

        // Stream the file
        const file = files[0];
        reply
            .code(200)
            .header('Content-Disposition', `attachment; filename=${file.name}`)
            .send(await this.storage.retrieveObject(StorageBucketName, file.storageId));
    };

    private uploadFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Failed to find the user');
        if (!req.isMultipart()) throw new BadRequestError('Request is not a Multipart');

        // Parse size from Content-Length
        const streamMeter = StreamMeter();
        let mimeType = '';
        let fileName = '';

        const oid = new mongodb.ObjectID();
        req.multipart(
            (field, file: Readable, filename, encoding, mimetype) => {
                if (field === 'file') {
                    fileName = filename;
                    mimeType = mimetype;
                    this.storage
                        .storeObject(StorageBucketName, file.pipe(streamMeter), oid)
                        .catch((err: Error) => {
                            reply.code(500).send({
                                message: `Something wrong with storage backend: ${err.message}`,
                                data: {
                                    name: err.name ? err.name : 'Unknown',
                                },
                            });
                        });
                }
            },
            async (err) => {
                if (err) throw new BadRequestError(`Failed to upload: ${err}`);
                const path = req.query['path'] as string;
                const pathArr = path.split('/').splice(1);

                // Do a BFS here to iterate a path tree.
                // If a path name is matched, continue; otherwise, return 404.
                let currPath = user.rootPath;
                for (const pathItem of pathArr) {
                    await currPath.populate('childrenPath').execPopulate();
                    const childPath = currPath.childrenPath.filter(
                        (element) => element.name === pathItem,
                    );

                    if (childPath.length < 1) {
                        throw new NotFoundError('Directory does not exist');
                    } else {
                        currPath = childPath[0];
                    }
                }

                // Create file index
                const file = await File.create({
                    size: streamMeter.bytes,
                    type: mimeType,
                    name: fileName,
                    owner: user._id,
                    path: currPath._id,
                    storageId: oid,
                });

                // Also add file index object to path
                await Path.updateOne({ _id: currPath._id }, { $push: { files: file._id } });

                reply.code(200).send({
                    message: 'File uploaded',
                    data: {
                        id: oid,
                    },
                });
            },
            {
                limits: {
                    files: 1,
                },
            },
        );
    };

    private moveFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        return;
    };

    private removeFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Failed to find the user');

        const path = req.body['file'] as string;
        let pathArr = [''];
        if (path.startsWith('/')) {
            pathArr = path.split('/').splice(1);
        }

        // Do a BFS here to iterate a path tree.
        // If a path name is matched, continue; otherwise, return 404.
        let currPath = user.rootPath;
        let fileName = '';
        for (const [idx, pathItem] of pathArr.entries()) {
            await currPath.populate('childrenPath').execPopulate();
            const childPath = currPath.childrenPath.filter((element) => element.name === pathItem);
            if (idx === pathArr.length - 1) {
                fileName = pathItem;
                break;
            }

            if (childPath.length < 1) {
                throw new NotFoundError('Directory does not exist');
            } else {
                currPath = childPath[0];
            }
        }

        // Load files from the directory it should be in
        await currPath.populate('files').execPopulate();

        // Load file
        const files = currPath.files.filter((element) => element.name === fileName);
        if (files.length < 1) {
            throw new NotFoundError('File does not exist');
        }

        // Perform deletion
        try {
            await this.storage.deleteObject(StorageBucketName, files[0].storageId);
            await files[0].remove();
            reply.code(200).send({ message: 'File deleted' });
        } catch (err) {
            throw new InternalError(`Failed to delete file: ${err}`);
        }
    };
}
