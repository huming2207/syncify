import { BaseController } from '../BaseController';
import { MiddlewareOptions, ServerInstance, ServerRequest, ServerReply } from 'fastify';
import FastifyFormBody from 'fastify-formbody';
import FastifyMultipart from 'fastify-multipart';
import mongodb from 'mongodb';
import mongoose from 'mongoose';
import File from '../../models/FileModel';
import User from '../../models/UserModel';
import Path from '../../models/PathModel';
import { NotFoundError, BadRequestError, InternalError } from '../../common/Errors';
import pump from 'pump';

export class FileController extends BaseController {
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
                    querystring: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', pattern: '^\/' }, // prettier-ignore
                            id: { type: 'string', minLength: 5 },
                        },
                    },
                },
            },
            this.getFile,
        );

        instance.put(
            '/file',
            {
                schema: {
                    body: {
                        type: 'object',
                        properties: {
                            old: { type: 'string', pattern: '^\//' }, // prettier-ignore
                            new: { type: 'string', pattern: '^\/' } // prettier-ignore
                        },
                    },
                },
            },
            this.moveFile,
        );

        instance.delete(
            '/file',
            {
                schema: {
                    body: {
                        type: 'object',
                        properties: {
                            file: { type: 'string', pattern: '^\/' } // prettier-ignore
                        },
                    },
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

        const db = mongoose.connection.db;
        const bucket = new mongodb.GridFSBucket(db);

        const path = req.query['path'] as string;
        const pathArr = path.split('/').splice(1);

        // Do a BFS here to iterate a path tree.
        // If a path name is matched, continue; otherwise, return 404.
        let currPath = user.rootPath;
        let fileName = '';
        for (const [idx, pathItem] of pathArr.entries()) {
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
        reply
            .code(200)
            .header('Content-Disposition', 'attachment; filename=test.html')
            .send(bucket.openDownloadStream(files[0].gridFile));
    };

    private uploadFile = async (req: ServerRequest, reply: ServerReply): Promise<void> => {
        const userId = (req.user as any)['id'];
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('Failed to find the user');
        if (!req.isMultipart()) throw new BadRequestError('Request is not a Multipart');
        if (!req.body['hash'] || !req.body['type'] || !req.body['name']) {
            throw new BadRequestError('Missing parameters');
        }

        const db = mongoose.connection.db;
        const bucket = new mongodb.GridFSBucket(db);

        const hash = '';
        const size = 0;
        const mimeType = '';
        const fileName = '';

        const oid = new mongodb.ObjectId();
        const uploadStream = bucket.openUploadStreamWithId(oid, fileName);

        uploadStream.on('finish', async () => {
            bucket.rename(oid, fileName);
            const path = req.query['path'] as string;
            const pathArr = path.split('/').splice(1);

            // Do a BFS here to iterate a path tree.
            // If a path name is matched, continue; otherwise, return 404.
            let currPath = user.rootPath;
            for (const pathItem of pathArr) {
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
                size,
                hash,
                type: mimeType,
                name: fileName,
                owner: user._id,
                path: currPath._id,
                gridFile: oid,
            });

            // Also add file index object to path
            await Path.updateOne({ _id: currPath._id }, { $push: { files: file._id } });
        });

        uploadStream.on('error', () => {
            throw new BadRequestError('Stream error');
        });

        const multipart = req.multipart(
            (field, file, filename, encoding, mimetype) => {
                console.log(filename, field, encoding, mimetype);
                pump(file, uploadStream, (err) => {
                    if (err) throw new BadRequestError(`Failed to upload: ${err}`);
                });
            },
            (err) => {
                if (err) throw new BadRequestError(`Failed to upload: ${err}`);
            },
        );

        multipart.on('field', function (key, value) {
            console.log('form-data', key, value);
        });

        reply.code(200).send({
            message: 'File uploaded',
            data: {
                id: oid,
            },
        });
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
            await files[0].remove();
            reply.code(200).send({ message: 'File deleted' });
        } catch (err) {
            throw new InternalError(`Failed to delete file: ${err}`);
        }
    };
}