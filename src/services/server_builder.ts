// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

import { Guild, Client } from 'discord.js';
import { ServerStructure } from '../types/nanogpt_types';

export const buildServerStructure = async (guild: Guild, structure: ServerStructure, client: Client) => {
  try {
    // Create categories (using forum channels as category containers)
    for (const category of structure.categories) {
      // Create a forum channel to act as a category
      const categoryChannel = await guild.channels.create({
        name: category.name,
        type: 15, // Forum channel type
      });

      // Create channels under this category
      for (const channel of category.channels) {
        if (channel.type === 'text') {
          await guild.channels.create({
            name: channel.name,
            type: 0, // Text channel
            parent: categoryChannel, // Assign to category
          });
        } else if (channel.type === 'voice') {
          await guild.channels.create({
            name: channel.name,
            type: 2, // Voice channel
            parent: categoryChannel, // Assign to category
          });
        }
      }
    }

    // Create roles
    for (const role of structure.roles) {
      await guild.roles.create({
        name: role.name,
        permissions: ['ViewChannel'], // Default permissions, adjust as needed
      });
    }

    console.log(`Successfully built server structure for guild: ${guild.name}`);
  } catch (error) {
    console.error('Error building server structure:', error);
    throw error;
  }
};