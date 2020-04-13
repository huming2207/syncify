import { Types, Document } from 'mongoose';

export interface FileMetadata {
    hash: string;
    type: string;
    owner: Types.ObjectId;
}

export interface FileDoc extends Document {
    length: number;
    chunkSize: number;
    uploadDate: Date;
    md5: string;
    filename: string;
}
