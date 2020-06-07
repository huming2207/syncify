import { UserDoc } from './UserModel';
import { Document, Schema, model, HookNextFunction } from 'mongoose';
import { FileDoc } from './FileModel';

export interface DirDoc extends Document {
    owner: UserDoc;
    childrenPath: DirDoc[];
    parentPath: DirDoc;
    name: string;
    created: Date;
    updated: Date;
    files: FileDoc[];
}

export const PathSchema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User' },
        childrenPath: [{ type: Schema.Types.ObjectId, ref: 'Directory' }],
        parentPath: { type: Schema.Types.ObjectId, ref: 'Directory' },
        name: { type: String },
        files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    },
    { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

PathSchema.pre<DirDoc>('remove', function (next: HookNextFunction) {
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
                    this.childrenPath.forEach(async (element: DirDoc) => {
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

export default model<DirDoc>('Directory', PathSchema);
