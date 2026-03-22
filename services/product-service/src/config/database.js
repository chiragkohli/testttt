import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * @param {string} mongoUri - MongoDB connection URI
 * @returns {Promise<typeof mongoose>}
 */
export const connectDatabase = async (mongoUri) => {
  try {
    const connection = await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Failed to disconnect MongoDB:', error);
  }
};
