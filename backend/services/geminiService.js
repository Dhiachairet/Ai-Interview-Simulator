const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in .env file');
} else {
  console.log('✅ GEMINI_API_KEY found');
}

const MODEL_NAMES = [
          
  'gemini-2.5-flash',     
  
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

// Evaluate full Vapi interview transcript with comprehensive analysis
async function evaluateVapiInterview(transcript, jobRole, difficulty = 'medium') {
  return callWithRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const difficultyLeniency = difficulty === 'easy' 
      ? ' Be 20% more lenient on scoring for easy difficulty level.'
      : difficulty === 'hard'
      ? ' Be 20% stricter on scoring for hard difficulty level.'
      : '';
    
    const prompt = `You are an expert technical interviewer. Analyze this complete interview transcript and provide a comprehensive evaluation.

Job Role: ${jobRole}
Difficulty Level: ${difficulty}
${difficultyLeniency}

Transcript:
${transcript}

Please evaluate the candidate across these dimensions:
1. Clarity & Communication - How clear and articulate were the responses?
2. Technical Knowledge - Depth and accuracy of technical understanding (if applicable)
3. Relevance - How well did answers address the questions?
4. Examples & Evidence - Did they provide specific examples and evidence?
5. Confidence - How confident did they sound?
6. Problem-solving - Ability to think critically and handle challenging questions

Parse the transcript to identify each question and answer pair. For each Q&A, provide a score and brief feedback.

Return ONLY this exact JSON format (NO markdown, NO extra text):
{
  "overallScore": 75,
  "communicationScore": 78,
  "technicalScore": 72,
  "confidenceLevel": "High",
  "summary": "The candidate demonstrated solid understanding with clear communication. They provided relevant examples but could improve depth on technical concepts.",
  "strengths": [
    "Clear articulation and professional demeanor",
    "Provided specific real-world examples",
    "Showed enthusiasm for the role"
  ],
  "improvements": [
    "Could provide more technical depth on specific concepts",
    "Try to address all parts of complex questions",
    "Elaborate more on problem-solving approach"
  ],
  "questionBreakdown": [
    {
      "questionNumber": 1,
      "question": "Tell me about yourself",
      "answer": "I am a frontend developer with 3 years of experience...",
      "score": 75,
      "feedback": "Good introduction with experience level, could mention specific achievements"
    }
  ]
}

IMPORTANT RULES:
- overallScore: Average of all individual question scores (0-100)
- communicationScore: Based on clarity, articulation, professionalism (0-100)
- technicalScore: Based on technical accuracy and depth (0-100) 
- confidenceLevel: "Low" (0-40), "Medium" (40-70), or "High" (70-100)
- strengths: Exactly 3 items, specific and actionable
- improvements: Exactly 3 items, specific and actionable
- Each question in breakdown must have score 0-100
- Return ONLY valid JSON, no markdown code blocks, no explanations`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      // Try to extract JSON from response
      let parsed;
      
      // First try direct parse
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Try to find JSON in text (in case of markdown wrapping)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      // Validate required fields
      if (typeof parsed.overallScore !== 'number' || parsed.overallScore < 0 || parsed.overallScore > 100) {
        throw new Error('Invalid overallScore');
      }
      
      return parsed;
    } catch (e) {
      console.error('Failed to parse Gemini evaluation response:', e);
      console.error('Raw response:', text);
      
      // Return fallback evaluation
      return {
        overallScore: 65,
        communicationScore: 65,
        technicalScore: 60,
        confidenceLevel: 'Medium',
        summary: 'Interview completed. Unable to provide detailed analysis at this time.',
        strengths: [
          'Participated in interview',
          'Provided responses',
          'Showed engagement'
        ],
        improvements: [
          'Provide more specific examples',
          'Expand on technical concepts',
          'Show more confidence'
        ],
        questionBreakdown: []
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
  evaluateVapiInterview,
  getUsageStats,
  MODEL_NAMES
};