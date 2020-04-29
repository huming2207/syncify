import { StorageAdapter } from './StorageAdapter';
import { Readable, Stream } from 'stream';
import mongoose from 'mongoose';
import mongodb, { ObjectId } from 'mongodb';

export class GridfsAdapter implements StorageAdapter {
    public performStoreObject = async (bucketName: string, stream: Readable): Promise<ObjectId> => {
        return new Promise((resolve, reject) => {
            const db = mongoose.connection.db;
            const bucket = new mongodb.GridFSBucket(db, { bucketName });
            const oid = new ObjectId();
            const uploadStream = bucket.openUploadStreamWithId(oid, '');
            uploadStream.on('error', (err) => {
                reject(err);
            });

            uploadStream.on('finish', () => {
                resolve(oid);
            });

            stream.pipe(uploadStream);
        });
    };

    public performRetrieveObject = async (bucketName: string, id: ObjectId): Promise<Stream> => {
        const db = mongoose.connection.db;
        const bucket = new mongodb.GridFSBucket(db, { bucketName });
        return bucket.openDownloadStream(id);
    };

    public performCopyObject = async (bucketName: string, id: ObjectId): Promise<ObjectId> => {
        return new Promise((resolve, reject) => {
            const db = mongoose.connection.db;
            const bucket = new mongodb.GridFSBucket(db, { bucketName });
            const origStream = bucket.openDownloadStream(id);
            const oid = new ObjectId();
            const newStream = bucket.openUploadStreamWithId(oid, '');
            newStream.on('error', (err) => {
                reject(err);
            });

            newStream.on('finish', () => {
                resolve(oid);
            });

            origStream.pipe(newStream);
        });
    };

    public performDeleteObject = async (bucketName: string, id: ObjectId): Promise<void> => {
        return new Promise((resolve, reject) => {
            const db = mongoose.connection.db;
            const bucket = new mongodb.GridFSBucket(db, { bucketName });
            bucket.delete(id, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    };
}
