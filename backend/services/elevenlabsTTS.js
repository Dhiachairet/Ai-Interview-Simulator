const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

// Initialize the client
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Voice mapping for each interviewer personality
const personalityVoiceMap = {
  'Strict Technical': {
    voiceId: '21m00Tcm4TlvDq8ikWAM',  // Adam - deep, authoritative
    modelId: 'eleven_turbo_v2_5',
    stability: 0.8,
    similarityBoost: 0.75,
    style: 0.2,
    speed: 1.05,
    description: 'Deep, authoritative professional voice'
  },
  'Friendly HR': {
    voiceId: 'EXAVITQu4vrKxnAkHtPU',  // Bella - warm, friendly
    modelId: 'eleven_turbo_v2_5',
    stability: 0.5,
    similarityBoost: 0.85,
    style: 0.8,
    speed: 0.92,
    description: 'Warm, friendly, engaging voice'
  },
  'Stress Tester': {
    voiceId: 'AZnzlk1XvdvUeBnXmlld',  // Antoni - intense, fast
    modelId: 'eleven_turbo_v2_5',
    stability: 0.4,
    similarityBoost: 0.9,
    style: 0.9,
    speed: 1.25,
    description: 'Fast, intense, dynamic voice'
  },
  'Theoretical Expert': {
    voiceId: 'VR6AewLTigWG4xSOdbrf',  // Liam - thoughtful
    modelId: 'eleven_turbo_v2_5',
    stability: 0.75,
    similarityBoost: 0.8,
    style: 0.4,
    speed: 0.88,
    description: 'Thoughtful, measured, academic voice'
  }
};

const defaultVoice = {
  voiceId: 'EXAVITQu4vrKxnAkHtPU',
  modelId: 'eleven_turbo_v2_5',
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.5,
  speed: 1.0
};

/**
 * Convert a readable stream to buffer
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Generate speech using ElevenLabs API
 */
async function generateSpeech(text, personality, isQuestion = true) {
  if (!text || text.trim().length === 0) {
    console.error('TTS Error: Empty text provided');
    return { success: false, error: 'Empty text' };
  }

  // Don't speak long feedback messages
  if (!isQuestion && text.length > 300) {
    console.log(`Skipping long feedback message (length: ${text.length})`);
    return { success: false, error: 'Feedback too long' };
  }

  try {
    const voiceConfig = personalityVoiceMap[personality] || defaultVoice;
    
    // Clean the text
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/[🌟👍💪📊⭐🎉💪🎯📈]/g, '')
      .replace(/Feedback:|Score:|Strengths:|Areas to Improve:|Final Score:|Duration:/g, '')
      .trim();
    
    console.log(`ElevenLabs TTS - Personality: ${personality}, Voice: ${voiceConfig.description}`);
    console.log(`Voice ID: ${voiceConfig.voiceId}, Model: ${voiceConfig.modelId}`);
    
    // Generate audio using the official SDK
    const audioStream = await client.textToSpeech.convert(voiceConfig.voiceId, {
      text: cleanText,
      model_id: voiceConfig.modelId,
      voice_settings: {
        stability: voiceConfig.stability,
        similarity_boost: voiceConfig.similarityBoost,
        style: voiceConfig.style,
        use_speaker_boost: true
      }
    });
    
    // Convert stream to buffer
    const audioBuffer = await streamToBuffer(audioStream);
    const audioBase64 = audioBuffer.toString('base64');
    
    console.log(`TTS Success - Audio size: ${audioBase64.length} chars`);
    
    return {
      success: true,
      audio: audioBase64,
      voiceUsed: voiceConfig.voiceId,
      personality: personality
    };
    
  } catch (error) {
    console.error('ElevenLabs TTS Error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate speech'
    };
  }
}

function getVoiceConfig(personality) {
  return personalityVoiceMap[personality] || defaultVoice;
}

module.exports = { 
  generateSpeech, 
  personalityVoiceMap, 
  getVoiceConfig
};