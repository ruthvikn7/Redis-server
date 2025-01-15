

// src/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};


//wsl for the configuration of the ubuntu and redis 
// # Update package list
// sudo apt update

// # Install software
// sudo apt install redis-server

// # Start a service
// sudo service redis-server start

// # Check service status
// sudo service redis-server status