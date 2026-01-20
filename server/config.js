import dotenv from 'dotenv';
dotenv.config();

export const {
  PORT = 3000,
  SALT_ROUNDS = 10,
  SECRET_JWT_KEY = 'K1lluaZk_JWT_9fA3xQ7mP2LwD8RkS5VbE0HnC4YJ'
} = process.env
