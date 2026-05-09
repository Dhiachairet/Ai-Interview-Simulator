const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in .env file');
} else {
  console.log('✅ GEMINI_API_KEY found');
}

// ✅ Multiple models for rotation to avoid rate limits
const MODEL_NAMES = [
  'gemini-2.5-flash',        // Primary - best quality
  'gemini-2.0-flash-exp',    // Experimental - higher free limits
  'gemini-1.5-flash',        // Fallback - stable
  'gemini-2.5-flash-lite'    // Lightweight - faster
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

// Reset counters periodically (every hour)
setInterval(() => {
  console.log('🔄 Resetting model usage counters');
  MODEL_NAMES.forEach(model => modelUsageCount.set(model, 0));
  lastModelSwitchTime = Date.now();
}, 60 * 60 * 1000);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced retry helper with model switching
async function callWithRetry(fn, maxRetries = 8) {
  let lastError = null;
  let modelsTried = new Set();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      let currentModel;
      if (modelsTried.size === MODEL_NAMES.length) {
        modelsTried.clear();
      }
      currentModel = getNextModel();
      modelsTried.add(currentModel);
      
      console.log(`📡 Attempt ${attempt + 1}/${maxRetries} using model: ${currentModel}`);
      
      const result = await fn(currentModel);
      
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
        console.warn(`⚠️ Rate limit hit, switching...`);
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
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

// ✅ UPDATED: Evaluate full Vapi interview transcript - NO HALLUCINATION
async function evaluateVapiInterview(transcript, jobRole, difficulty = 'medium') {
  return callWithRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const difficultyLeniency = difficulty === 'easy' 
      ? ' Be 20% more lenient on scoring for easy difficulty level.'
      : difficulty === 'hard'
      ? ' Be 20% stricter on scoring for hard difficulty level.'
      : '';
    
    const maxTranscriptLength = 15000;
    const truncatedTranscript = transcript.length > maxTranscriptLength 
      ? transcript.substring(0, maxTranscriptLength) + '\n...[transcript truncated due to length]...'
      : transcript;
    
    // ✅ NEW PROMPT - Explicitly forbids fabricating answers
    const prompt = `You are an expert interviewer analyzing an interview transcript.

⚠️ CRITICAL RULE - NO HALLUCINATION:
- DO NOT invent, imagine, or create ANY candidate answers
- ONLY use information that is EXPLICITLY present in the transcript
- If a candidate answer is missing, leave the "answer" field as "[No answer provided]"
- If the transcript has no candidate answers, questionBreakdown MUST be an empty array []
- Score 0 for any question where no answer exists

Job Role: ${jobRole}
Difficulty Level: ${difficulty}
${difficultyLeniency}

TRANSCRIPT (what was actually said):
${truncatedTranscript}

Based ONLY on the transcript above, return this exact JSON format:

{
  "overallScore": 0,
  "communicationScore": 0,
  "technicalScore": 0,
  "confidenceLevel": "Low",
  "summary": "Summary based ONLY on available data",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "questionBreakdown": []
}

RULES:
- overallScore: 0-100 (average of question scores, 0 if no answers)
- communicationScore: 0-100 (based on available answers)
- technicalScore: 0-100 (based on available answers)
- confidenceLevel: "Low" (0-40), "Medium" (40-70), or "High" (70-100)
- strengths: EXACTLY 3 items (use "Insufficient data" if needed)
- improvements: EXACTLY 3 items (use "Insufficient data" if needed)
- questionBreakdown: ONLY include questions that have BOTH question AND answer in transcript
- DO NOT add any questions without answers
- DO NOT create fake content
- Return ONLY valid JSON, no markdown, no explanations`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      let parsed;
      
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      // Ensure all required fields exist
      return {
        overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 0,
        communicationScore: typeof parsed.communicationScore === 'number' ? parsed.communicationScore : 0,
        technicalScore: typeof parsed.technicalScore === 'number' ? parsed.technicalScore : 0,
        confidenceLevel: ['Low', 'Medium', 'High'].includes(parsed.confidenceLevel) ? parsed.confidenceLevel : 'Low',
        summary: parsed.summary || 'Interview completed.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : ['Insufficient data', 'Insufficient data', 'Insufficient data'],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : ['Insufficient data', 'Insufficient data', 'Insufficient data'],
        questionBreakdown: Array.isArray(parsed.questionBreakdown) ? parsed.questionBreakdown : []
      };
      
    } catch (e) {
      console.error('Failed to parse Gemini evaluation response:', e);
      console.error('Raw response:', text);
      
      // ✅ Safe fallback - no fake content
      return {
        overallScore: 0,
        communicationScore: 0,
        technicalScore: 0,
        confidenceLevel: 'Low',
        summary: 'Unable to evaluate interview. No valid data in transcript.',
        strengths: ['Insufficient data', 'Insufficient data', 'Insufficient data'],
        improvements: ['Insufficient data', 'Insufficient data', 'Insufficient data'],
        questionBreakdown: []
      };
    }
  });
}

// Get current usage statistics
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
  evaluateVapiInterview,
  getUsageStats,
  MODEL_NAMES
};