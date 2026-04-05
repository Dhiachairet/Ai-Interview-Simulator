const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in .env file');
} else {
  console.log('✅ GEMINI_API_KEY found');
}

const MODEL_NAMES = [
  'gemini-2.0-flash-exp',      
  'gemini-1.5-flash',          
  'gemini-2.5-flash-lite',     
  'gemini-1.5-flash-8b',       
  'gemini-2.0-flash-lite-preview-02-05' 
];

let currentModelIndex = 0;
let modelUsageCount = new Map();
let lastModelSwitchTime = Date.now();

// Initialize usage counters
MODEL_NAMES.forEach(model => modelUsageCount.set(model, 0));

// Get next model in rotation
function getNextModel() {
  const model = MODEL_NAMES[currentModelIndex];
  currentModelIndex = (currentModelIndex + 1) % MODEL_NAMES.length;
  return model;
}

// Get least used model (more sophisticated than simple rotation)
function getLeastUsedModel() {
  let minUsage = Infinity;
  let leastUsedModel = MODEL_NAMES[0];
  
  for (const [model, count] of modelUsageCount.entries()) {
    if (count < minUsage) {
      minUsage = count;
      leastUsedModel = model;
    }
  }
  return leastUsedModel;
}

// Reset counters periodically (every hour)
setInterval(() => {
  console.log('🔄 Resetting model usage counters');
  MODEL_NAMES.forEach(model => modelUsageCount.set(model, 0));
  lastModelSwitchTime = Date.now();
}, 60 * 60 * 1000); // Reset every hour

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced retry helper with model switching
async function callWithRetry(fn, maxRetries = 5) {
  let lastError = null;
  let modelsTried = new Set();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get current model
      let currentModel;
      if (modelsTried.size === MODEL_NAMES.length) {
        // If we've tried all models, reset and start over
        modelsTried.clear();
      }
      currentModel = getNextModel();
      modelsTried.add(currentModel);
      
      console.log(`📡 Attempt ${attempt + 1}/${maxRetries} using model: ${currentModel}`);
      
      const result = await fn(currentModel);
      
      // Increment usage counter for successful request
      modelUsageCount.set(currentModel, (modelUsageCount.get(currentModel) || 0) + 1);
      console.log(`✅ Success with ${currentModel} (usage: ${modelUsageCount.get(currentModel)})`);
      
      return result;
      
    } catch (error) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('quota') ||
                          error.status === 429 ||
                          error.message?.includes('limit');
      
      if (isRateLimit) {
        console.warn(`⚠️ Rate limit hit on model, switching...`);
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // Non-rate-limit error, still try other models
        console.warn(`⚠️ Error with model: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.error('❌ All models failed after max retries');
  throw lastError || new Error('Max retries exceeded');
}

// Generate interview question
async function generateQuestion(jobRole, personality, difficulty, previousAnswer = null) {
  return callWithRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    let prompt = `You are a ${personality} interviewer conducting a ${difficulty} level interview for a ${jobRole} position.`;
    
    if (previousAnswer) {
      prompt += ` The candidate just answered: "${previousAnswer.substring(0, 200)}". Based on this, ask a relevant follow-up question.`;
    } else {
      prompt += ` Ask the first interview question. Start with a professional greeting.`;
    }
    
    prompt += ` Keep the question concise and realistic for a real job interview.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  });
}

// Evaluate user's answer
async function evaluateAnswer(question, answer, jobRole, personality, difficulty) {
  return callWithRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const prompt = `You are an expert interviewer. Evaluate this candidate's answer:

Question: ${question}
Answer: ${answer}
Job Role: ${jobRole}
Interviewer Style: ${personality}
Difficulty: ${difficulty}

Provide feedback in this exact JSON format (ONLY return the JSON, no other text):
{
  "score": 75,
  "feedback": "brief constructive feedback (2-3 sentences)",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"]
}

Give a score from 0-100 based on relevance, clarity, and depth.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error, using fallback');
      return {
        score: 70,
        feedback: "Good attempt! Try to provide more specific examples.",
        strengths: ["Attempted to answer the question"],
        improvements: ["Add more specific examples", "Structure your answer more clearly"]
      };
    }
  });
}

// Optional: Get current usage statistics
function getUsageStats() {
  const stats = {};
  for (const [model, count] of modelUsageCount.entries()) {
    stats[model] = count;
  }
  return stats;
}

module.exports = { 
  generateQuestion, 
  evaluateAnswer,
  getUsageStats,
  MODEL_NAMES
};