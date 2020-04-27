import { StorageAdaptor } from './StorageAdaptor';
import { Readable } from 'stream';
import minio from 'minio';

export class S3Adaptor implements StorageAdaptor {
    private client: minio.Client;

    constructor(options: minio.ClientOptions) {
        this.client = new minio.Client(options);
    }

    public performStoreObject = async (
        bucketName: string,
        fileName: string,
        stream: Readable,
        size: number,
    ): Promise<string> => {
        throw new Error('Method not implemented.');
    };

    public performRetrieveObject = async (
        bucketName: string,
        fileName: string,
    ): Promise<Readable> => {
        throw new Error('Method not implemented.');
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
