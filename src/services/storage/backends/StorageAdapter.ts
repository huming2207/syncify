import { Readable, Stream } from 'stream';
import mongodb from 'mongodb';

export interface StorageAdapter {
    performStoreObject(bucketName: string, stream: Readable): Promise<mongodb.ObjectId>;
    performRetrieveObject(bucketName: string, id: mongodb.ObjectId): Promise<Stream>;
    performCopyObject(bucketName: string, id: mongodb.ObjectId): Promise<mongodb.ObjectId>;
    performDeleteObject(bucketName: string, id: mongodb.ObjectId): Promise<void>;
}
