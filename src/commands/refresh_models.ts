// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { fetchModels } from '../services/nanogpt_api';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refresh_models')
    .setDescription('Refresh the list of available NanoGPT models'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();
      
      const models = await fetchModels();
      
      await interaction.editReply({
        content: `✅ Models refreshed successfully!\n${models.text.length} text models and ${models.image.length} image models available.`,
      });
    } catch (error) {
      console.error('Error refreshing models:', error);
      await interaction.editReply({
        content: '❌ Failed to refresh models. Please check the logs.',
      });
    }
  },
};