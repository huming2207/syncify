import { BaseController } from '../BaseController';
import { MiddlewareOptions, ServerInstance, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import FastifyMultipart from 'fastify-multipart';
import mongodb from 'mongodb';
import File from '../../models/FileModel';
import User from '../../models/UserModel';
import Path from '../../models/PathModel';
import {
    NotFoundError,
    BadRequestError,
    InternalError,
    UnauthorisedError,
} from '../../common/Errors';
import { Readable } from 'stream';
import StreamMeter from 'stream-meter';
import { StorageService, StorageBucketName } from '../../services/storage/StorageService';
import { CopyMoveSchema } from '../../common/schemas/request/CopyMoveSchema';
import { ErrorSchema } from '../../common/schemas/response/ErrorResponseSchema';
import { SuccessResponseSchema } from '../../common/schemas/response/SuccessResponseSchema';
import { traversePathTree, getFileFromDirectory } from '../../common/TreeTraverser';
import { RenameSchema } from '../../common/schemas/request/RenameSchema';

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
            '/file/move',
            {
                schema: {
                    description: 'Move a file',
                    body: CopyMoveSchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
                },
            },
            this.moveFile,
        );

        instance.put(
            '/file/copy',
            {
                schema: {
                    description: 'Duplicate a file',
                    body: CopyMoveSchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
                },
            },
            this.copyFile,
        );

        instance.put(
            '/file/rename',
            {
                schema: {
                    description: 'Rename a file',
                    body: RenameSchema,
                    consumes: ['application/x-www-form-urlencoded'],
                    produces: ['application/json'],
                    security: [{ JWT: [] }],
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
                },
            },
            this.renameFile,
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
                    response: { 200: SuccessResponseSchema, ...ErrorSchema },
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

        const currPath = await traversePathTree(
            user.rootPath,
            path.substring(0, path.lastIndexOf('/')),
        );

        const fileName = path.substring(path.lastIndexOf('/') + 1);

        // Stream the file
        const file = await getFileFromDirectory(currPath, fileName);
        reply
            .code(200)
            .header('Content-Disposition', `attachment; filename=${file.name}`)
            .send(await this.storage.retrieveObject(StorageBucketName, file.storageId));
    };

    private uploadFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Failed to find the user');
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

                // Do a BFS here to iterate a path tree.
                // If a path name is matched, continue; otherwise, return 404.
                // If the path is the root path, skip the BFS.
                let currPath = user.rootPath;
                if (path !== '/') {
                    const pathArr = path.split('/').splice(1);
                    for (const pathItem of pathArr) {
                        await currPath.populate('childrenPath').execPopulate();
                        const childPath = currPath.childrenPath.filter(
                            (element) => element.name === pathItem,
                        );

                        if (childPath.length < 1) {
                            reply.code(404).send({
                                message: 'Directory does not exist',
                                data: {
                                    id: oid,
                                },
                            });
                        } else {
                            currPath = childPath[0];
                        }
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

    private copyFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const origPathName = req.body['orig'] as string;
        const origPath = await traversePathTree(
            user.rootPath,
            origPathName.substring(0, origPathName.lastIndexOf('/')), // Get the path without the file, e.g. /home/test/foo.txt => /home/test
        );

        const destPathName = req.body['dest'] as string;
        const destPath = await traversePathTree(user.rootPath, destPathName);
        const file = await getFileFromDirectory(
            origPath,
            origPathName.substring(origPathName.lastIndexOf('/') + 1),
        );

        const newFileId = await this.storage.copyObject(StorageBucketName, file.storageId);

        try {
            const newFile = await File.create({
                size: file.size,
                type: file.type,
                name: file.name,
                owner: user._id,
                path: destPath._id,
                storageId: newFileId,
            });
            await Path.updateOne(destPath, { $push: { files: newFile._id } });
        } catch (err) {
            console.error(err);
            throw new InternalError('Failed to copy file record');
        }

        reply.code(200).send({
            message: 'File copied',
            data: {
                file,
            },
        });

        return;
    };

    private moveFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const origPathName = req.body['orig'] as string;
        const origPathDir = origPathName.substring(0, origPathName.lastIndexOf('/')); // Get the path without the file, e.g. /home/test/foo.txt => /home/test
        const origPathFile = origPathName.substring(origPathName.lastIndexOf('/') + 1);

        const destPathName = req.body['dest'] as string;
        const destPathDir = destPathName.substring(0, destPathName.lastIndexOf('/')); // Get the path without the file, e.g. /home/test/foo.txt => /home/test
        const destPathFile = destPathName.substring(destPathName.lastIndexOf('/') + 1);

        const origPath = await traversePathTree(user.rootPath, origPathDir);
        const file = await getFileFromDirectory(origPath, origPathFile);

        try {
            // If the directory part is the same, then it must be a rename request
            // e.g. /home/test.txt -> /home/foo.txt, where the directory part is all "/home"
            if (origPathDir === destPathDir) {
                await File.updateOne(file, { name: destPathFile });
                reply.code(200).send({
                    message: 'File renamed',
                    data: {
                        file,
                    },
                });
            } else {
                const destPath = await traversePathTree(user.rootPath, destPathName);
                await File.updateOne(file, { path: destPath }); // Change the file's path field to the new path
                await Path.updateOne(origPath, { $pull: { files: file._id } }); // Pull out the file from the original path
                await Path.updateOne(destPath, { $push: { files: file._id } });
                reply.code(200).send({
                    message: 'File moved',
                    data: {
                        file,
                    },
                });
            }
        } catch (err) {
            console.error(err);
            throw new InternalError('Failed to move file record');
        }
    };

    private renameFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Cannot load current user');
        const pathStr = req.body['item'] as string;
        const newName = req.body['name'] as string;

        const itemDir = pathStr.substring(0, pathStr.lastIndexOf('/')); // Get the path without the file, e.g. /home/test/foo.txt => /home/test
        const itemName = pathStr.substring(pathStr.lastIndexOf('/') + 1);

        try {
            const currPath = await traversePathTree(user.rootPath, itemDir);
            const currFile = await getFileFromDirectory(currPath, itemName);
            await File.updateOne(currFile, { name: newName });
            reply.code(200).send({ message: 'File renamed', data: {} });
        } catch (err) {
            throw new InternalError('Failed to rename file');
        }
    };

    private removeFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new UnauthorisedError('Failed to find the user');

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
