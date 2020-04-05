import * as mongoose from 'mongoose';

export interface UserDoc extends mongoose.Document {
    username: string;
    password: string;
    email: string;
}

export const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    email: { type: String, unique: true },
});

export default mongoose.model<UserDoc>('User', UserSchema);
