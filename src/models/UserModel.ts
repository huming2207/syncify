import { PathDoc } from './PathModel';
import { Document, Schema, Types, model, HookNextFunction } from 'mongoose';

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

UserSchema.pre<UserDoc>('find', function (next: HookNextFunction) {
    this.populate('rootPath');
    next();
});

UserSchema.pre<UserDoc>('findOne', function (next: HookNextFunction) {
    this.populate('rootPath');
    next();
});

export default model<UserDoc>('User', UserSchema);
