import { PathDoc } from './PathModel';
import { Document, Schema, Types, model } from 'mongoose';

export interface UserDoc extends Document {
    username: string;
    password: string;
    email: string;
    rootPath: PathDoc;
}

export const UserSchema = new Schema({
    username: { type: String, unique: true },
    password: { type: String },
    email: { type: String, unique: true },
    rootPath: { type: Types.ObjectId, ref: 'Path' },
});

export default model<UserDoc>('User', UserSchema);
