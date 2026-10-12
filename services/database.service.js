const mongoose = require('mongoose');

class DatabaseService {
  constructor() {
    this.connection = null;
    this.isConnecting = false;
    this.connectionError = null;
  }

  maskMongoUri(uri) {
    if (!uri) return 'None';
    try {
      // Replace username:password with ***:***
      return uri.replace(/\/\/(.*?)@/, '//***:***@');
    } catch {
      return '***';
    }
  }

  async connect(mongoUri) {
    const uri = mongoUri || process.env.MONGO_URL;

    if (!uri) {
      this.connectionError = 'MONGO_URL is not defined in environment variables.';
      console.warn('⚠️ [DatabaseService] MONGO_URL not provided. Running in offline/sample mode.');
      return false;
    }

    if (this.isConnected()) {
      return true;
    }

    this.isConnecting = true;
    this.connectionError = null;

    try {
      console.log(`🔌 [DatabaseService] Connecting to MongoDB: ${this.maskMongoUri(uri)}`);
      
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      this.connection = conn;
      this.isConnecting = false;
      console.log('✅ [DatabaseService] Successfully connected to MongoDB Atlas / Database!');

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ [DatabaseService] MongoDB disconnected.');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ [DatabaseService] MongoDB connection error:', err.message);
        this.connectionError = err.message;
      });

      return true;
    } catch (err) {
      this.isConnecting = false;
      this.connectionError = err.message;
      console.error('❌ [DatabaseService] Failed to connect to MongoDB:', err.message);
      return false;
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return {
      state: states[mongoose.connection.readyState] || 'unknown',
      readyState: mongoose.connection.readyState,
      isConnected: this.isConnected(),
      error: this.connectionError,
      maskedUri: this.maskMongoUri(process.env.MONGO_URL)
    };
  }
}

module.exports = new DatabaseService();
