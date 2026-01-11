// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { generateImage } from '../services/nanogpt_api';
import { getUserModel } from '../database/models_db';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('generate_image')
    .setDescription('Generate an image using your selected image model')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Describe the image you want to generate')
        .setRequired(true)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();
      
      const prompt = interaction.options.getString('prompt', true);
      const userId = interaction.user.id;
      
      // Get user's selected image model
      const imageModelId = await getUserModel(userId, 'image');
      if (!imageModelId) {
        await interaction.editReply({
          content: '❌ Please set your image model first using /set_model image',
        });
        return;
      }
      
      // Generate the image
      const imageData = await generateImage(imageModelId, prompt, userId);
      
      // Convert base64 to buffer for Discord
      const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
      
      await interaction.editReply({
        content: `🖼️ Generated image with model: ${imageModelId}`,
        files: [{
          attachment: imageBuffer,
          name: 'generated_image.png'
        }]
      });
    } catch (error) {
      console.error('Error generating image:', error);
      await interaction.editReply({
        content: '❌ Failed to generate image. Please try again later.',
      });
    }
  },
};