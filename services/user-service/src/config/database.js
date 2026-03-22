import { DataSource } from 'typeorm';
import { User } from '../models/user.model.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
  database: process.env.DB_NAME || 'ecommerce_users',
  synchronize: true, // Auto-sync schema in development
  logging: process.env.NODE_ENV === 'development',
  entities: [User],
  migrations: [],
  subscribers: [],
});
