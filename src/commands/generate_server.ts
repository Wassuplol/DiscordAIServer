// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import { getUserModel } from '../database/models_db';
import { generateImage } from '../services/nanogpt_api';
import fetch from 'node-fetch';
import { buildServerStructure } from '../services/server_builder';
import { ServerStructure } from '../types/nanogpt_types';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('generate_server')
    .setDescription('Generate a Discord server structure based on your description')
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Describe the server you want to create')
        .setRequired(true)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();
      
      const description = interaction.options.getString('description', true);
      const userId = interaction.user.id;
      const client: Client = interaction.client;
      
      // Get user's selected models
      const textModelId = await getUserModel(userId, 'text');
      const imageModelId = await getUserModel(userId, 'image');
      
      if (!textModelId) {
        await interaction.editReply({
          content: '❌ Please set your text model first using /set_model text',
        });
        return;
      }
      
      if (!imageModelId) {
        await interaction.editReply({
          content: '❌ Please set your image model first using /set_model image',
        });
        return;
      }
      
      // Generate icon
      const iconPrompt = `Minimalist Discord server icon for ${description}`;
      const iconBase64 = await generateImage(imageModelId, iconPrompt, userId);
      const iconBuffer = Buffer.from(iconBase64.split(',')[1], 'base64');
      
      // Generate server structure using text model
      const systemPrompt = `You are a Discord server architect. Output ONLY valid JSON with this structure: 
      { name: string, categories: [{ name: string, channels: [{ name: string, type: 'text' | 'voice' }] }], 
        roles: [{ name: string, permissions: string }] }`;
      
      const userPrompt = `Create a Discord server structure for: ${description}`;
      
      // For simplicity, we'll mock the text generation response since we don't have a real endpoint
      // In a real implementation, this would call the text model API
      const payload = {
        model: textModelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      };
      
      const response = await fetch('https://api.nanogpt.com/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NANO_GPT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate server structure: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from text model');
      }
      
      // Parse the JSON response
      let serverStructure: ServerStructure;
      try {
        // Extract JSON from response if it includes other text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          serverStructure = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      } catch (parseError) {
        throw new Error(`Could not parse server structure from model response: ${parseError}`);
      }
      
      // Create the server
      const serverName = serverStructure.name || `Generated Server - ${description.substring(0, 20)}`;
      const newGuild = await client.guilds.create({
        name: serverName,
        icon: iconBuffer,
      });
      
      // Build the server structure
      await buildServerStructure(newGuild, serverStructure, client);
      
      await interaction.editReply({
        content: `✅ Server "${serverName}" created successfully!`,
      });
    } catch (error) {
      console.error('Error generating server:', error);
      await interaction.editReply({
        content: '❌ Failed to generate server. Please try again later.',
      });
    }
  },
};