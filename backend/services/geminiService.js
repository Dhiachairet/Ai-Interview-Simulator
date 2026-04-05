const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in .env file');
} else {
  console.log('✅ GEMINI_API_KEY found');
}

// ✅ USE THE STABLE MODEL NAME
const MODEL_NAME = 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate interview question
async function generateQuestion(jobRole, personality, difficulty, previousAnswer = null) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
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
    console.log('✅ Question generated successfully');
    return text;
  } catch (error) {
    console.error('Gemini API Error in generateQuestion:', error);
    // Return a fallback question
    if (!previousAnswer) {
      return `Welcome to your ${difficulty} level interview for ${jobRole}. Could you please introduce yourself and tell me about your relevant experience?`;
    } else {
      return `Thank you for your response. Can you tell me about a challenging project you worked on?`;
    }
  }
}

// Evaluate user's answer
async function evaluateAnswer(question, answer, jobRole, personality, difficulty) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
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
    console.log('✅ Evaluation received successfully');
    
    // Try to parse JSON
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
  } catch (error) {
    console.error('Gemini API Error in evaluateAnswer:', error);
    return {
      score: 65,
      feedback: "Thank you for your response. Keep practicing!",
      strengths: ["Participated in the interview"],
      improvements: ["Review common interview questions", "Practice your responses"]
    };
  }
}

module.exports = { generateQuestion, evaluateAnswer };