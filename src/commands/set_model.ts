// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { getAvailableModels } from '../services/nanogpt_api';
import { setUserModel } from '../database/models_db';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set_model')
    .setDescription('Set your preferred text or image model')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Choose model type')
        .setRequired(true)
        .addChoices(
          { name: 'Text', value: 'text' },
          { name: 'Image', value: 'image' }
        )),
  
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      const type = interaction.options.getString('type', true) as 'text' | 'image';
      const models = getAvailableModels();
      
      if (!models[type].length) {
        await interaction.editReply({
          content: `❌ No ${type} models available. Please refresh models first.`,
        });
        return;
      }
      
      // Create select menu with available models
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select_${type}_model`)
        .setPlaceholder(`Select a ${type} model...`)
        .addOptions(
          models[type].map(model => 
            new StringSelectMenuOptionBuilder()
              .setLabel(model.name)
              .setValue(model.id)
              .setDescription(`ID: ${model.id}`)
          )
        );
      
      const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(selectMenu);
      
      await interaction.editReply({
        content: `Please select your preferred ${type} model:`,
        components: [row],
      });
    } catch (error) {
      console.error('Error in set_model command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while setting the model.',
      });
    }
  },
};