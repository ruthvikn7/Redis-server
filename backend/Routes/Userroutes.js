import express from 'express';
import {User} from '../Model/UserModel.js';
import { cacheMiddleware,redisClient } from '../Config/redis.js';
import { clearCache, createUser, deleteUser, getAllUsers, getCacheData, getUserData, updateUser } from '../Controller/UserController.js';

const router = express.Router();

router.post('/newuser/',createUser)

// Get all users with cache
router.get('/', cacheMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    await redisClient.setEx(req.originalUrl, 3600, JSON.stringify(users)); // Cache for 1 hour
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/user/:id', cacheMiddleware, getUserData);

// Route to view all cache data
router.get('/cache', getCacheData);


router.delete('/users/:id', deleteUser);
router.delete('/cache', clearCache);
router.put('/users/:id', updateUser);


// Route to get all users
router.get('/users', getAllUsers);

// Create new user


export default router;