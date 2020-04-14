import { Types, Document, Schema, model, NativeError } from 'mongoose';
import mongodb from 'mongodb';
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

FileSchema.post('remove', function (
    err: NativeError,
    doc: FileDoc,
    next: (err?: NativeError) => void,
) {
    if (err) {
        next(err);
        return;
    }

    if (doc.gridFile) {
        const db = doc.db.db;
        const bucket = new mongodb.GridFSBucket(db);
        bucket.delete(doc.gridFile, (err) => {
            if (err) next(err);
        });
    }

    next();
});

export default model<FileDoc>('File', FileSchema);
