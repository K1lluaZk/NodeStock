import dotenv from 'dotenv';
dotenv.config();

export const {
  PORT = 3000,
  SALT_ROUNDS = 10,
  SECRET_JWT_KEY = 'esta-es-una-llave-muy-secreta-y-larga-para-el-token'
} = process.env;
