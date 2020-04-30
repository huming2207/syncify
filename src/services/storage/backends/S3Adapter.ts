import { StorageAdapter } from './StorageAdapter';
import { Readable, Stream } from 'stream';
import minio, { CopyConditions } from 'minio';
import { ObjectId } from 'mongodb';

export class S3Adapter implements StorageAdapter {
    private client: minio.Client;

    constructor(options: minio.ClientOptions) {
        this.client = new minio.Client(options);
    }

    public performStoreObject = async (
        bucketName: string,
        stream: Readable,
        id: ObjectId,
    ): Promise<void> => {
        await this.client.putObject(bucketName, id.toHexString(), stream);
    };

    public performRetrieveObject = async (bucketName: string, id: ObjectId): Promise<Stream> => {
        return this.client.getObject(bucketName, id.toHexString());
    };

    public performCopyObject = async (bucketName: string, id: ObjectId): Promise<ObjectId> => {
        const oid = new ObjectId();
        const condition = new CopyConditions();
        await this.client.copyObject(bucketName, oid.toHexString(), id.toHexString(), condition);
        return oid;
    };

    public performDeleteObject = async (bucketName: string, id: ObjectId): Promise<void> => {
        return await this.client.removeObject(bucketName, id.toHexString());
    };
}
