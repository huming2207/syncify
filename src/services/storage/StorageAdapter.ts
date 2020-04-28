import { Readable } from 'stream';

export interface StorageAdapter {
    performStoreObject(
        bucketName: string,
        fileName: string,
        stream: Readable,
        size: number,
    ): Promise<string>;

    performRetrieveObject(bucketName: string, fileName: string): Promise<Readable>;
    performCopyObject(bucketName: string, srcName: string, dstName: string): Promise<void>;
    performDeleteObject(bucketName: string, fileName: string): Promise<void>;
}
