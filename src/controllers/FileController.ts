import { BaseController } from './BaseController';
import { Joi } from 'koa-joi-router';
import { Next, Context } from 'koa';
import mongodb from 'mongodb';
import mongoose from 'mongoose';
import { FileMetadata, FileDoc } from '../models/FileModel';
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
        for (const pathItem of pathArr) {
            const childPath = currPath.childrenPath.filter((element) => element.name === pathItem);
            if (childPath.length < 1) {
                ctx.status = 404;
                ctx.type = 'json';
                ctx.body = { msg: 'Directory does not exist', data: pathArr };
                return next();
            } else {
                currPath = childPath[0];
            }
        }

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
        const metadata: FileMetadata = {
            hash: parts.field['hash'],
            type: parts.field['type'],
            owner: user._id, // User ID from JWT
        };

        const oid = new mongodb.ObjectId();
        const uploadStream = bucket.openUploadStreamWithId(oid, parts.field['name'], {
            metadata: metadata,
        });

        uploadStream.on('finish', async () => {
            bucket.rename(oid, parts.field['name']);
            const path = ctx.request.query['path'] as string;
            const pathArr = path.split('/').splice(1);

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

            await Path.updateOne({ _id: currPath._id }, { $push: { files: oid } });
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

    private renameFile = async (ctx: Context, next: Next): Promise<void> => {
        return next();
    };

    private removeFile = async (ctx: Context, next: Next): Promise<void> => {
        return next();
    };
}
