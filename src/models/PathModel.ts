import { UserDoc } from './UserModel';
import { GridFileInfo } from 'mongoose-gridfs';
import { Document, Schema, model } from 'mongoose';

export interface PathDoc extends Document {
    owner: UserDoc;
    childrenPath: PathDoc[];
    name: string;
    files: GridFileInfo[];
}

export const PathSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    childrenPath: [{ type: Schema.Types.ObjectId, ref: 'Path' }],
    name: { type: String },
    files: [{ type: Schema.Types.ObjectId, ref: 'fs.files' }],
});

export default model<PathDoc>('Path', PathSchema);
