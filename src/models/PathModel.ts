import { UserDoc } from './UserModel';
import { Document, Schema, model, HookNextFunction } from 'mongoose';
import File, { FileDoc } from './FileModel';

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

PathSchema.pre<PathDoc>('remove', function (next: HookNextFunction) {
    // Remove children path
    this.childrenPath.forEach(async (element: PathDoc) => {
        try {
            await element.remove();
        } catch (err) {
            next(err);
        }
    });

    // Also remove files, if it has
    if (this.files.length > 0) {
        File.deleteMany({ _id: { $in: this.files } }).catch((err) => {
            if (err) next(err);
        });
    }

    next();
});

export default model<PathDoc>('Path', PathSchema);
