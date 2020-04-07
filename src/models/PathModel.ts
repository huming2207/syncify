import mongoose from 'mongoose';
import { UserDoc } from './UserModel';
import { GridFileInfo } from 'mongoose-gridfs';

export interface PathDoc extends mongoose.Document {
    owner: UserDoc;
    childrenPath: PathDoc[];
    name: string;
    files: GridFileInfo[];
}

export const PathSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    childrenPath: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Path' }],
    name: { type: String },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'fs.files' }],
});

export default mongoose.model<PathDoc>('Path', PathSchema);
