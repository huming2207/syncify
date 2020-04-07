import * as mongoose from 'mongoose';
import { PathDoc } from './PathModel';

export interface UserDoc extends mongoose.Document {
    username: string;
    password: string;
    email: string;
    rootPath: PathDoc;
}

export const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    email: { type: String, unique: true },
    rootPath: { type: mongoose.Types.ObjectId, ref: 'Path' },
});

export default mongoose.model<UserDoc>('User', UserSchema);
