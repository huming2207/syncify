import { Types } from 'mongoose';

export interface FileMetadata {
    hash: string;
    type: string;
    owner: Types.ObjectId;
}
