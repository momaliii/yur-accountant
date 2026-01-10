import mongoose from 'mongoose';

// Connection pool options for performance
const connectionOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yur-finance';
    await mongoose.connect(mongoURI, connectionOptions);
    console.log('MongoDB connected successfully');
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get database statistics
export const getDBStats = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return null;
    }
    
    const stats = await db.stats();
    const collections = await db.listCollections().toArray();
    
    return {
      database: db.databaseName,
      collections: collections.length,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
    };
  } catch (error) {
    console.error('Error getting DB stats:', error);
    return null;
  }
};
