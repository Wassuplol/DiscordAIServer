// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

import { Client, Events, GatewayIntentBits, Collection, Interaction } from 'discord.js';
import cron from 'node-cron';
import { fetchModels } from './services/nanogpt_api';
import { initDatabase } from './database/models_db';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Initialize database
await initDatabase();

// Initialize models
await fetchModels();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Command collection
client.commands = new Collection();

// Register commands
const commandFiles = [
  './commands/refresh_models.ts',
  './commands/set_model.ts',
  './commands/generate_image.ts',
  './commands/generate_server.ts'
];

for (const file of commandFiles) {
  const command = await import(file);
  client.commands.set(command.data.name, command);
}

// Event handlers
client.once(Events.ClientReady, async () => {
  console.log('Bot is ready!');
  
  // Register slash commands globally
  const commands = [];
  for (const file of commandFiles) {
    const command = await import(file);
    commands.push(command.data.toJSON());
  }
  
  await client.application?.commands.set(commands);
  
  // Schedule model refresh every 24 hours
  cron.schedule('0 0 */24 * * *', async () => {
    console.log('Refreshing models...');
    try {
      await fetchModels();
      console.log('Models refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh models:', error);
    }
  });
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true
      });
    }
  }
  
  // Handle select menu interactions
  if (interaction.isStringSelectMenu()) {
    const [prefix, type] = interaction.customId.split('_');
    
    if (prefix === 'select' && (type === 'text' || type === 'image')) {
      const selectedModelId = interaction.values[0];
      const userId = interaction.user.id;
      
      try {
        // Import here to avoid circular dependencies
        const { setUserModel } = await import('./database/models_db');
        const { getAvailableModels } = await import('./services/nanogpt_api');
        
        const models = getAvailableModels();
        const selectedModel = models[type].find(m => m.id === selectedModelId);
        
        if (!selectedModel) {
          await interaction.update({
            content: '❌ Invalid model selected.',
            components: []
          });
          return;
        }
        
        await setUserModel(userId, type, selectedModelId);
        
        await interaction.update({
          content: `✅ ${type} model set to: ${selectedModel.name} (ID: ${selectedModel.id})`,
          components: []
        });
      } catch (error) {
        console.error(`Error setting ${type} model:`, error);
        await interaction.update({
          content: '❌ An error occurred while setting the model.',
          components: []
        });
      }
    }
  }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);