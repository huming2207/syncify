import { StorageAdapter } from './StorageAdapter';
import { Readable, Stream } from 'stream';
import { ObjectId } from 'mongodb';

export class StorageService {
    private adapter: StorageAdapter;

    constructor(adapter: StorageAdapter) {
        this.adapter = adapter;
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
