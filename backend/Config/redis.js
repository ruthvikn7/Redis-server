// src/config/redis.js
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      console.log(`Redis reconnection attempt ${retries}`);
      if (retries > 3) {
        console.log('Redis connection failed. Please check if Redis is still running in WSL');
        console.log('To restart Redis: Open WSL and run: sudo service redis-server restart');
        return false;
      }
      return Math.min(retries * 1000, 3000);
    }
  }
};

export const redisClient = createClient(REDIS_CONFIG);

redisClient.on('connect', () => {
  console.log('Successfully connected to Redis (WSL)');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
  console.log('To restart Redis in WSL: sudo service redis-server restart');
});

export const initRedis = async () => {
  try {
    await redisClient.connect();
    // Test connection
    await redisClient.set('test-key', 'working');
    console.log('Redis connection test successful');
  } catch (error) {
    console.error('Redis initialization failed:', error.message);
  }
};

// Cache middleware
export const cacheMiddleware = async (req, res, next) => {
  if (!redisClient.isReady) {
    return next();
  }
  
  try {
    const key = req.originalUrl;
    const cachedData = await redisClient.get(key);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    
    next();
  } catch (error) {
    console.error('Cache Middleware Error:', error);
    next();
  }
};