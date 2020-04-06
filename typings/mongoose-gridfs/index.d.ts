declare module 'mongoose-gridfs' {
    import mongodb from 'mongodb';
    import mongoose from 'mongoose';

    export type GridFileInfo = {
        _id?: string | number | object;
        filename: string;
        metadata?: object;
        contentType?: string;
        disableMD5?: boolean;
        aliases?: Array<string>;
        chunkSizeBytes?: number;
        start?: number;
        end?: number;
        revision?: number;
    };

    export type GridFSModelOptions = mongodb.GridFSBucketOptions & {
        connection?: mongoose.Connection;
        modelName?: string;
    };

    export type WriteCallback = (err: Error | null | undefined, file: GridFileInfo) => void;
    export type ReadCallback = (err: Error | null | undefined, buffer: Buffer) => void;
    export type DeleteCallback = (err: Error | null | undefined) => void;
    export type FindCallback = (err: Error | null | undefined) => void;

    export class MongooseGridFS {
        createWriteStream(options: GridFileInfo): mongodb.GridFSBucketWriteStream;
        createReadStream(options: GridFileInfo): mongodb.GridFSBucketReadStream;
        writeFile(
            file: GridFileInfo,
            readStream: NodeJS.ReadableStream,
            writeCb: WriteCallback,
        ): mongodb.GridFSBucketWriteStream;
        readFile(file: GridFileInfo, readCb: ReadCallback): mongodb.GridFSBucketWriteStream;
        deleteFile(fileId: string | number | object, deleteCb: DeleteCallback): void;
        findOne(file: GridFileInfo, findCb: FindCallback): void;
        findById(fileId: string | number | object, findCb: FindCallback): void;
    }

    export function createBucket(options?: mongodb.GridFSBucketOptions): mongodb.GridFSBucket;
    export function createModel(options?: GridFSModelOptions): mongodb.GridFSBucket;
}
