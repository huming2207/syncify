import { BaseController } from './BaseController';
import { Joi } from 'koa-joi-router';
import { Next, Context } from 'koa';
import { createModel } from 'mongoose-gridfs';
import mongodb from 'mongodb';
import mongoose from 'mongoose';
import User from '../models/UserModel';
import { FileMetadata } from '../models/MetadataModel';

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
        return next();
    };

    private uploadFile = async (ctx: Context, next: Next): Promise<void> => {
        const req = ctx.request as any;
        const parts = req['parts'];
        console.log(parts);
        console.log(parts.field);
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
            owner: ctx.state.user['id'], // User ID from JWT
        };

        const oid = new mongodb.ObjectId();
        const uploadStream = bucket.openUploadStreamWithId(oid, parts.field['name'], {
            metadata: metadata,
        });

        uploadStream.on('finish', () => {
            bucket.rename(oid, parts.field['name']);
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

        console.log(parts.field);

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
