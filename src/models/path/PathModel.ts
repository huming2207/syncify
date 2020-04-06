import mongoose from 'mongoose';
import { UserDoc } from '../user/UserModel';

export interface PathDoc extends mongoose.Document {
    owner: UserDoc;
    childrenPath: PathDoc[];
    name: string;
}

export const PathSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    childrenPath: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Path' }],
    name: { type: String },
});

export default mongoose.model<PathDoc>('Path', PathSchema);
