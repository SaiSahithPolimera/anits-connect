const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    try {
        const mongoUrl = process.env.MONGO_DB_URL;

        if (!mongoUrl) {
            throw new Error('MONGO_DB_URL is not defined in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUrl, {
            // Modern Mongoose doesn't need these options anymore
            // They're included by default
        });

        isConnected = true;
        console.log('MongoDB connected successfully');

        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            isConnected = false;
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
};

module.exports = connectDB;
