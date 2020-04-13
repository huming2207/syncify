import { UserDoc } from './UserModel';
import { Document, Schema, model, HookNextFunction } from 'mongoose';
import { FileDoc } from './FileModel';

export interface PathDoc extends Document {
    owner: UserDoc;
    childrenPath: PathDoc[];
    name: string;
    files: FileDoc[];
}

export const PathSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    childrenPath: [{ type: Schema.Types.ObjectId, ref: 'Path' }],
    name: { type: String },
    files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
});

PathSchema.pre<PathDoc>('find', function (next: HookNextFunction) {
    this.populate('childrenPath');
    next();
});

PathSchema.pre<PathDoc>('findOne', function (next: HookNextFunction) {
    this.populate('childrenPath');
    next();
});

export default model<PathDoc>('Path', PathSchema);
