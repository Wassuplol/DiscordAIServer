// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database;

export const initDatabase = async () => {
  try {
    db = await open({
      filename: process.env.DATABASE_PATH || './data/models.sqlite',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_models (
        user_id TEXT PRIMARY KEY,
        text_model_id TEXT,
        image_model_id TEXT
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const setUserModel = async (userId: string, type: 'text' | 'image', modelId: string) => {
  try {
    await db.run(
      `INSERT OR REPLACE INTO user_models (user_id, ${type}_model_id) VALUES (?, ?)`,
      [userId, modelId]
    );
  } catch (error) {
    console.error(`Error setting ${type} model for user ${userId}:`, error);
    throw error;
  }
};

export const getUserModel = async (userId: string, type: 'text' | 'image') => {
  try {
    const result: any = await db.get(
      `SELECT ${type}_model_id FROM user_models WHERE user_id = ?`,
      [userId]
    );
    
    return result ? result[`${type}_model_id`] : null;
  } catch (error) {
    console.error(`Error getting ${type} model for user ${userId}:`, error);
    throw error;
  }
};