import { Types, Document, Schema, model, HookNextFunction } from 'mongoose';
import { UserDoc } from './UserModel';
import { PathDoc } from './PathModel';
import { StorageService, StorageBucketName } from '../services/storage/StorageService';

export interface FileDoc extends Document {
    size: number;
    hash: string;
    type: string;
    name: string;
    owner: UserDoc;
    path: PathDoc;
    created: Date;
    updated: Date;
    storageId: Types.ObjectId;
}

export const FileSchema = new Schema(
    {
        size: { type: Number },
        hash: { type: String },
        type: { type: String },
        name: { type: String },
        owner: { type: Types.ObjectId, ref: 'User' },
        path: { type: Types.ObjectId, ref: 'Path' },
        storageId: { type: Types.ObjectId },
    },
    { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

FileSchema.pre<FileDoc>('remove', function (next: HookNextFunction) {
    if (this.storageId) {
        const storage = StorageService.getInstance();
        storage
            .deleteObject(StorageBucketName, this.storageId)
            .then(() => {
                next();
            })
            .catch((err) => {
                if (err) next(err);
            });
    }
});

export default model<FileDoc>('File', FileSchema);
