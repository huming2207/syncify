import { Types, Document, Schema, model } from 'mongoose';
import { UserDoc } from './UserModel';
import { PathDoc } from './PathModel';

export interface FileDoc extends Document {
    size: number;
    hash: string;
    type: string;
    name: string;
    owner: UserDoc;
    path: PathDoc;
    gridFile: Types.ObjectId;
}

export const FileSchema = new Schema({
    size: { type: Number },
    hash: { type: String },
    type: { type: String },
    name: { type: String },
    owner: { type: Types.ObjectId, ref: 'User' },
    path: { type: Types.ObjectId, ref: 'Path' },
    gridFile: { type: Types.ObjectId },
});

export default model<FileDoc>('File', FileSchema);
