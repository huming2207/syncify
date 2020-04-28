import { StorageAdapter } from './StorageAdapter';
import { Readable } from 'stream';
import minio from 'minio';
import mongoose from 'mongoose';
import mongodb from 'mongodb';

export class S3Adapter implements StorageAdapter {
    private client: minio.Client;

    constructor(options: minio.ClientOptions) {
        this.client = new minio.Client(options);
    }

    public performStoreObject = async (
        bucketName: string,
        stream: Readable,
    ): Promise<mongodb.ObjectId> => {
        throw new Error('Method not implemented.');
    };

    public performRetrieveObject = async (
        bucketName: string,
        id: mongodb.ObjectId,
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
