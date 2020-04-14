import { BaseController } from './BaseController';
import { Joi } from 'koa-joi-router';
import { Next, Context } from 'koa';
import mongodb from 'mongodb';
import mongoose from 'mongoose';
import File from '../models/FileModel';
import { UserDoc } from '../models/UserModel';
import Path from '../models/PathModel';

export class FileController extends BaseController {
    constructor() {
        super();
        this.router.get(
            '/file',
            {
                validate: {
                    query: {
                        path: Joi.string().regex(/^\//),
                        id: Joi.string().min(5),
                    },
                },
            },
            this.getFile,
        );

        this.router.post(
            '/file',
            {
                validate: {
                    type: 'multipart',
                },
            },
            this.uploadFile,
        );

        this.router.put(
            '/file',
            {
                validate: {
                    type: 'form',
                    body: {
                        old: Joi.string().regex(/^\//),
                        new: Joi.string().regex(/^\//),
                    },
                },
            },
            this.moveFile,
        );

        this.router.delete(
            '/file',
            {
                validate: {
                    type: 'form',
                    body: {
                        file: Joi.string().regex(/^\//),
                    },
                },
            },
            this.removeFile,
        );
    }

    private getFile = async (ctx: Context, next: Next): Promise<void> => {
        const user = ctx.state.user['obj'] as UserDoc;
        const db = mongoose.connection.db;
        const bucket = new mongodb.GridFSBucket(db);

        const path = ctx.request.query['path'] as string;
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
                ctx.status = 404;
                ctx.type = 'json';
                ctx.body = { msg: 'Directory does not exist', data: pathArr };
                return next();
            } else {
                currPath = childPath[0];
            }
        }

        // Load files from the directory it should be in
        await currPath.populate('files').execPopulate();

        // Load file
        const files = currPath.files.filter((element) => element.name === fileName);
        if (files.length < 1) {
            ctx.status = 404;
            ctx.type = 'json';
            ctx.body = { msg: 'File does not exist', data: pathArr };
            return next();
        }

        // Stream the file
        ctx.status = 200;
        ctx.response.attachment(fileName);
        ctx.body = bucket.openDownloadStream(files[0].gridFile);

        return next();
    };

    private uploadFile = async (ctx: Context, next: Next): Promise<void> => {
        const user = ctx.state.user['obj'] as UserDoc;
        const req = ctx.request as any;
        const parts = req['parts'];
        if (parts === undefined || parts.field == undefined) {
            ctx.status = 400;
            ctx.type = 'json';
            ctx.body = { msg: 'Nothing uploaded', data: null };
            return next();
        }

        const db = mongoose.connection.db;
        const bucket = new mongodb.GridFSBucket(db);

        const oid = new mongodb.ObjectId();
        const uploadStream = bucket.openUploadStreamWithId(oid, parts.field['name']);

        uploadStream.on('finish', async () => {
            bucket.rename(oid, parts.field['name']);
            const path = ctx.request.query['path'] as string;
            let pathArr = [''];
            if (path.startsWith('/')) {
                pathArr = path.split('/').splice(1);
            }

            // Do a BFS here to iterate a path tree.
            // If a path name is matched, continue; otherwise, return 404.
            let currPath = user.rootPath;
            for (const pathItem of pathArr) {
                const childPath = currPath.childrenPath.filter(
                    (element) => element.name === pathItem,
                );

                if (childPath.length < 1) {
                    ctx.status = 404;
                    ctx.type = 'json';
                    ctx.body = { msg: 'Directory does not exist', data: pathArr };
                    return next();
                } else {
                    currPath = childPath[0];
                }
            }

            // Create file index
            const file = await File.create({
                size: parts.field['size'],
                hash: parts.field['hash'],
                type: parts.field['type'],
                name: parts.field['name'],
                owner: user._id,
                path: currPath._id,
                gridFile: oid,
            });

            // Also add file index object to path
            await Path.updateOne({ _id: currPath._id }, { $push: { files: file._id } });
        });

        uploadStream.on('error', () => {
            ctx.status = 200;
            ctx.type = 'json';
            ctx.body = {
                msg: 'Failed to upload data, stream error',
                data: null,
            };

            return next();
        });

        let part;
        try {
            while ((part = await parts)) {
                part.pipe(uploadStream);
            }
        } catch (err) {
            ctx.status = 400;
            ctx.type = 'json';
            ctx.body = { msg: 'Failed to upload the file', data: err };
            return next();
        }

        ctx.status = 200;
        ctx.type = 'json';
        ctx.body = {
            msg: 'File uploaded',
            data: {
                ...parts.field,
                id: oid,
            },
        };

        return next();
    };

    private moveFile = async (ctx: Context, next: Next): Promise<void> => {
        return next();
    };

    private removeFile = async (ctx: Context, next: Next): Promise<void> => {
        return next();
    };
}
