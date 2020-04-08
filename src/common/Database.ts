import mongoose from 'mongoose';

export const connectToDb = async (): Promise<void> => {
    await mongoose.connect(
        process.env.SYNCIFY_DB_URL
            ? process.env.SYNCIFY_DB_URL
            : 'mongodb://localhost:27017/syncify',
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    );
};
