import { StorageAdapter } from './StorageAdapter';
import { Readable, Stream } from 'stream';
import { Client, CopyConditions, ClientOptions } from 'minio';
import { ObjectId } from 'mongodb';

export class S3Adapter implements StorageAdapter {
    private client: Client;

    constructor(options: ClientOptions) {
        this.client = new Client(options);
    }

    public performStoreObject = async (
        bucketName: string,
        stream: Readable,
        id: ObjectId,
    ): Promise<void> => {
        if (!(await this.client.bucketExists(bucketName)))
            await this.client.makeBucket(
                bucketName,
                process.env.SYNCIFY_STORAGE_REGION
                    ? process.env.SYNCIFY_STORAGE_REGION
                    : 'us-east-1',
            );
        await this.client.putObject(bucketName, id.toHexString(), stream);
    };

    public performRetrieveObject = async (bucketName: string, id: ObjectId): Promise<Stream> => {
        return this.client.getObject(bucketName, id.toHexString());
    };

    public performCopyObject = async (bucketName: string, id: ObjectId): Promise<ObjectId> => {
        const oid = new ObjectId();
        const condition = new CopyConditions();
        await this.client.copyObject(
            bucketName,
            oid.toHexString(),
            `/${bucketName}/${id.toHexString()}`,
            condition,
        );
        return oid;
    };

    public performDeleteObject = async (bucketName: string, id: ObjectId): Promise<void> => {
        return await this.client.removeObject(bucketName, id.toHexString());
    };
}
