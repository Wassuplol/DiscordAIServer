// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

import fetch from 'node-fetch';
import { NanoGPTModel } from '../types/nanogpt_types';

let availableModels: { text: NanoGPTModel[], image: NanoGPTModel[] } = { text: [], image: [] };

export const fetchModels = async (): Promise<{ text: NanoGPTModel[], image: NanoGPTModel[] }> => {
  try {
    const response = await fetch('https://api.nanogpt.com/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.NANO_GPT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const models: NanoGPTModel[] = await response.json();

    // Categorize models dynamically
    const textModels = models.filter(m => 
      m.capabilities.includes('chat') || m.capabilities.includes('completion')
    );
    
    const imageModels = models.filter(m => 
      m.capabilities.includes('image')
    );

    availableModels = { text: textModels, image: imageModels };
    
    console.log(`Fetched ${models.length} total models (${textModels.length} text, ${imageModels.length} image)`);
    
    return availableModels;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
};

export const getAvailableModels = (): { text: NanoGPTModel[], image: NanoGPTModel[] } => {
  return availableModels;
};

export const generateImage = async (modelId: string, prompt: string, userId: string): Promise<string> => {
  try {
    const imageModel = availableModels.image.find(m => m.id === modelId);
    if (!imageModel) {
      throw new Error(`Image model with ID ${modelId} not found`);
    }

    const payload = {
      model: modelId,
      prompt: prompt,
      size: imageModel.max_resolution // Must come from API response
    };

    const response = await fetch('https://api.nanogpt.com/api/generate-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NANO_GPT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Assuming the API returns base64 encoded image
    if (result.data && typeof result.data === 'string') {
      return result.data;
    } else {
      throw new Error('Invalid image generation response');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};