import { Readable } from 'stream';
import mongodb from 'mongodb';

export interface StorageAdapter {
    performStoreObject(bucketName: string, stream: Readable): Promise<mongodb.ObjectId>;
    performRetrieveObject(bucketName: string, id: mongodb.ObjectId): Promise<Readable>;
    performCopyObject(bucketName: string, srcName: string, dstName: string): Promise<void>;
    performDeleteObject(bucketName: string, fileName: string): Promise<void>;
}
