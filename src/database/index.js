import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'
import config from '../config/config.js'

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(config.MONGO_URI);

        console.log(`MongoDB Connected ✅: ${connectionInstance.connection.host} - ${DB_NAME}`
        );

    } catch (error) {
        console.error("MongoDB connection FAILED ❌", error.message);
        throw error;

    }
}
export default connectDB;