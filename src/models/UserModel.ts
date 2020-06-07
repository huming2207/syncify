import { DirDoc } from './DirModel';
import { Document, Schema, Types, model, HookNextFunction } from 'mongoose';

export interface UserDoc extends Document {
    username: string;
    password: string;
    email: string;
    rootPath: DirDoc;
}

export const UserSchema = new Schema({
    username: { type: String, unique: true },
    password: { type: String },
    email: { type: String, unique: true },
    rootPath: { type: Types.ObjectId, ref: 'Directory' },
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
