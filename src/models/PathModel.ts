import { UserDoc } from './UserModel';
import { Document, Schema, model, HookNextFunction } from 'mongoose';
import { FileDoc } from './FileModel';

export interface PathDoc extends Document {
    owner: UserDoc;
    childrenPath: PathDoc[];
    parentPath: PathDoc;
    name: string;
    created: Date;
    updated: Date;
    files: FileDoc[];
}

export const PathSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    childrenPath: [{ type: Schema.Types.ObjectId, ref: 'Path' }],
    parentPath: { type: Schema.Types.ObjectId, ref: 'Path' },
    name: { type: String },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
});

PathSchema.pre<PathDoc>('remove', function (next: HookNextFunction) {
    this.populate('childrenPath', (err) => {
        if (err) {
            next(err);
            return;
        } else {
            this.populate('files', (err) => {
                if (err) {
                    next(err);
                    return;
                } else {
                    // Remove children path
                    this.childrenPath.forEach(async (element: PathDoc) => {
                        try {
                            await element.remove();
                        } catch (err) {
                            next(err);
                        }
                    });

                    // Also remove files, if it has any
                    this.files.forEach(async (element: FileDoc) => {
                        try {
                            await element.remove();
                        } catch (err) {
                            next(err);
                        }
                    });

                    next();
                }
            });
        }
    });
});

export default model<PathDoc>('Path', PathSchema);
