import { UserDoc } from './UserModel';
import { Document, Schema, model, HookNextFunction } from 'mongoose';
import { FileDoc } from './FileModel';

export interface DirDoc extends Document {
    owner: UserDoc;
    children: DirDoc[];
    parent: DirDoc;
    name: string;
    created: Date;
    updated: Date;
    files: FileDoc[];
}

export const DirSchema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User' },
        children: [{ type: Schema.Types.ObjectId, ref: 'Directory' }],
        parent: { type: Schema.Types.ObjectId, ref: 'Directory' },
        name: { type: String },
        files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    },
    { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

DirSchema.pre<DirDoc>('remove', function (next: HookNextFunction) {
    this.populate('children', (err) => {
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
                    this.children.forEach(async (element: DirDoc) => {
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

export default model<DirDoc>('Directory', DirSchema);
