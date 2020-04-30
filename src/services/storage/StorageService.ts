import { StorageAdapter } from './backends/StorageAdapter';
import { Readable, Stream } from 'stream';
import { ObjectId } from 'mongodb';
import { S3Adapter } from './backends/S3Adapter';
import { GridfsAdapter } from './backends/GridfsAdapter';

export class StorageService {
    private adapter: StorageAdapter;

    constructor() {
        if (process.env.SYNCIFY_STORAGE_BACKEND === 's3') {
            this.adapter = new S3Adapter({
                endPoint: process.env.SYNCIFY_STORAGE_ENDPOINT
                    ? process.env.SYNCIFY_STORAGE_ENDPOINT
                    : '',
                port: parseInt(
                    process.env.SYNCIFY_STORAGE_PORT ? process.env.SYNCIFY_STORAGE_PORT : '443',
                ),
                useSSL: process.env.SYNCIFY_STORAGE_USE_SSL === 'true',
                accessKey: process.env.SYNCIFY_STORAGE_ACCESS_KEY
                    ? process.env.SYNCIFY_STORAGE_ACCESS_KEY
                    : '',
                secretKey: process.env.SYNCIFY_STORAGE_SECRET_KEY
                    ? process.env.SYNCIFY_STORAGE_SECRET_KEY
                    : '',
            });
        } else {
            this.adapter = new GridfsAdapter();
        }
    }

    public storeObject = async (bucketName: string, stream: Readable): Promise<ObjectId> => {
        return this.adapter.performStoreObject(bucketName, stream);
    };

    public retrieveObject = async (bucketName: string, id: ObjectId): Promise<Stream> => {
        return this.adapter.performRetrieveObject(bucketName, id);
    };

    public copyObject = async (bucketName: string, id: ObjectId): Promise<ObjectId> => {
        return this.adapter.performCopyObject(bucketName, id);
    };

    public deleteObject = async (bucketName: string, id: ObjectId): Promise<void> => {
        return this.adapter.performDeleteObject(bucketName, id);
    };
}

export const StorageBucketName = process.env.SYNCIFY_STORAGE_BUCKET
    ? process.env.SYNCIFY_STORAGE_BUCKET
    : 'syncify';
