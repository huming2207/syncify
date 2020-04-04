import * as mongoose from 'mongoose';

export interface UserDoc extends mongoose.Document {
    username: string;
    password: string;
    email: string;
}

export const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
});

export default mongoose.model<UserDoc>('User', UserSchema);
