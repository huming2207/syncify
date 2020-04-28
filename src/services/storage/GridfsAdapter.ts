import { StorageAdapter } from './StorageAdapter';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import mongodb from 'mongodb';

export class GridfsAdapter implements StorageAdapter {
    public performStoreObject = async (
        bucketName: string,
        stream: Readable,
    ): Promise<mongodb.ObjectId> => {
        const db = mongoose.connection.db;
        const bucket = new mongodb.GridFSBucket(db, { bucketName });
        const oid = new mongodb.ObjectId();
        const uploadStream = bucket.openUploadStreamWithId(oid, '');
        stream.pipe(uploadStream);

        return oid;
    };

    public performRetrieveObject = async (
        bucketName: string,
        id: mongodb.ObjectId,
    ): Promise<Readable> => {
        const db = mongoose.connection.db;
        const bucket = new mongodb.GridFSBucket(db, { bucketName });
        return bucket.openDownloadStream(id);
    };

    public performCopyObject = async (
        bucketName: string,
        srcName: string,
        dstName: string,
    ): Promise<void> => {
        throw new Error('Method not implemented.');
    };

    public performDeleteObject = async (bucketName: string, fileName: string): Promise<void> => {
        throw new Error('Method not implemented.');
    };
}
