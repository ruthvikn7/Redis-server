
import { redisClient } from '../Config/redis.js';
import { User } from '../Model/UserModel.js';

export const createUser = async (req, res) => {
    const { name, email, age } = req.body;
  
    try {
      // Validate input
      if (!name || !email || !age) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
  
      // Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists.' });
      }
  
      // Create a new user
      const newUser = new User({ name, email, age });
      const savedUser = await newUser.save();
  
      // Delete invalid data (e.g., user drafts or stale cache entries)
      const invalidCacheKey = `invalid_user:${email}`;
      if (redisClient.isReady) {
        await redisClient.del(invalidCacheKey);
        console.log(`Deleted invalid data from cache for key: ${invalidCacheKey}`);
      }
  
      // Update the cache with the new user data
      const cacheKey = `user:${savedUser._id}`;
      if (redisClient.isReady) {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(savedUser));
        console.log(`Updated cache with new user data for key: ${cacheKey}`);
      }
  
      return res.status(201).json({
        message: 'User created successfully.',
        data: savedUser,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        message: 'Internal server error.',
        error: error.message,
      });
    }
  };




// Function to fetch data from cache or database
export const getUserData = async (req, res) => {
  const userId = req.params.id; // Assuming user ID is passed as a route parameter
  const cacheKey = `user:${userId}`;

  try {
    // Check if Redis client is ready
    if (!redisClient.isReady) {
      console.warn('Redis client is not ready, proceeding with database lookup.');
    } else {
      // Check if data is in the cache
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log('Data retrieved from cache:', cachedData);
        return res.status(200).json({
          source: 'cache',
          data: JSON.parse(cachedData),
        });
      }
    }

    // Data not in cache, fetch from database
    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Save the data to Redis cache with a TTL (e.g., 1 hour)
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(userData));
      console.log('Data retrieved from database and saved to cache');
    }

    return res.status(200).json({
      source: 'database',
      data: userData,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to view all keys and values in Redis cache
export const getCacheData = async (req, res) => {
    try {
      // Check if Redis client is ready
      if (!redisClient.isReady) {
        return res.status(503).json({ message: 'Redis client is not ready' });
      }
  
      // Get all keys in Redis
      const keys = await redisClient.keys('*');
      const cacheData = {};
  
      // Fetch values for all keys
      for (const key of keys) {
        const value = await redisClient.get(key);
  
        try {
          // Try parsing the value as JSON
          cacheData[key] = JSON.parse(value);
        } catch (error) {
          // If parsing fails, log the invalid entry and skip it
          console.warn(`Skipping invalid JSON data for key: ${key}`);
        }
      }
  
      console.log('Cache data:', cacheData);
      return res.status(200).json(cacheData);
    } catch (error) {
      console.error('Error fetching cache data:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  



export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the user
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Remove the user from the cache
    const cacheKey = `user:${id}`;
    await redisClient.del(cacheKey);

    console.log(`User deleted and cache updated for key: ${cacheKey}`);

    return res.status(200).json({
      message: 'User deleted successfully.',
      data: user,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      message: 'Internal server error.',
      error: error.message,
    });
  }
};


export const getAllUsers = async (req, res) => {
    const cacheKey = 'users:all';
  
    try {
      // Check if data is in the cache
      const cachedData = await redisClient.get(cacheKey);
  
      if (cachedData) {
        console.log('Data retrieved from cache:', cachedData);
        return res.status(200).json({
          source: 'cache',
          data: JSON.parse(cachedData),
        });
      }
  
      // Data not in cache, fetch from database
      const users = await User.find();
  
      // Save the data to Redis cache with a TTL (e.g., 1 hour)
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(users));
  
      console.log('Data retrieved from database and saved to cache');
      return res.status(200).json({
        source: 'database',
        data: users,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        message: 'Internal server error.',
        error: error.message,
      });
    }
  };



  export const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { name, email, age } = req.body;
  
    try {
      // Validate input
      if (!name || !email || !age) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
  
      // Find the user in the database by ID
      const user = await User.findByIdAndUpdate(
        userId,
        { name, email, age },
        { new: true }  // Return the updated user object
      );
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Create the cache key for Redis
      const cacheKey = `user:${userId}`;
  
      // Update the Redis cache with the new data
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));  // Setting the cache with TTL of 1 hour
  
      console.log(`Cache updated for key: ${cacheKey}`);
  
      return res.status(200).json({
        message: 'User updated successfully.',
        data: user,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        message: 'Internal server error.',
        error: error.message,
      });
    }
  };


export const clearCache = async (req, res) => {
  try {
    // Check if Redis client is ready
    if (!redisClient.isReady) {
      return res.status(503).json({ message: 'Redis client is not ready' });
    }

    // Flush all data in the Redis cache
    await redisClient.flushAll();

    console.log('All cache data has been deleted');

    return res.status(200).json({ message: 'All cache data has been cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
  





