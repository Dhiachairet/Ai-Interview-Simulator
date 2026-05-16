const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Correct import for pdf-parse
const pdfParse = require('pdf-parse');

// Available Gemini models for rotation
const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-pro'
];

let currentModelIndex = 0;

const getNextModel = () => {
  const model = GEMINI_MODELS[currentModelIndex];
  currentModelIndex = (currentModelIndex + 1) % GEMINI_MODELS.length;
  console.log(`🔄 Using Gemini model: ${model}`);
  return model;
};

// Extract text from PDF
const extractPDFText = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

// Extract text from DOCX
const extractDOCXText = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parse error:', error);
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
};

// Extract text from PDF or DOCX
const extractTextFromFile = async (buffer, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      console.log('📄 Extracting text from PDF...');
      const text = await extractPDFText(buffer);
      if (!text || text.length < 20) {
        throw new Error('PDF text extraction returned empty or very short content');
      }
      console.log(`✅ Extracted ${text.length} characters from PDF`);
      return text;
    } 
    else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('📄 Extracting text from DOCX...');
      const text = await extractDOCXText(buffer);
      if (!text || text.length < 20) {
        throw new Error('DOCX text extraction returned empty or very short content');
      }
      console.log(`✅ Extracted ${text.length} characters from DOCX`);
      return text;
    }
    throw new Error('Unsupported file type. Please upload PDF or DOCX.');
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

// Retry parsing with model rotation
const parseResumeWithGemini = async (extractedText) => {
  const maxRetries = GEMINI_MODELS.length * 2;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const modelName = getNextModel();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const prompt = `
    You are a resume parser. Extract whatever information you can find from this resume.
    If certain fields don't exist, use empty strings or empty arrays.
    
    Resume Text:
    ${extractedText.substring(0, 8000)}
    
    Return ONLY valid JSON with this structure. No extra text, just the JSON:
    {
      "name": "Full name",
      "email": "Email address",
      "phone": "Phone number",
      "detectedJobRole": "Best matching job role",
      "skills": ["skill1", "skill2"],
      "experience": [
        {
          "title": "Job title",
          "company": "Company name",
          "duration": "Date range",
          "description": "Key responsibilities"
        }
      ],
      "education": [
        {
          "degree": "Degree name",
          "institution": "School name",
          "year": "Year"
        }
      ],
      "projects": [
        {
          "name": "Project name",
          "description": "Brief description",
          "technologies": ["tech1", "tech2"]
        }
      ],
      "certifications": ["cert1"],
      "languages": ["lang1"],
      "summary": "Brief summary",
      "yearsOfExperience": 0,
      "educationLevel": "Highest degree"
    }
    `;
    
    try {
      console.log(`📡 Attempt ${attempt + 1}/${maxRetries} with model: ${modelName}`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const hasName = !!parsed.name;
        const hasSkills = parsed.skills?.length > 0;
        const hasExperience = parsed.experience?.length > 0;
        
        let confidence = 'medium';
        if (hasName && hasSkills && hasExperience) confidence = 'high';
        if (!hasName && !hasSkills && !hasExperience) confidence = 'low';
        
        console.log(`✅ Parse successful with ${modelName}, confidence: ${confidence}`);
        
        return {
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          detectedJobRole: parsed.detectedJobRole || 'Software Developer',
          skills: parsed.skills || [],
          experience: parsed.experience || [],
          education: parsed.education || [],
          projects: parsed.projects || [],
          certifications: parsed.certifications || [],
          languages: parsed.languages || [],
          summary: parsed.summary || '',
          yearsOfExperience: typeof parsed.yearsOfExperience === 'number' ? parsed.yearsOfExperience : 0,
          educationLevel: parsed.educationLevel || '',
          parsingConfidence: confidence
        };
      }
    } catch (error) {
      console.warn(`⚠️ Model ${modelName} failed:`, error.message);
      
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('quota') ||
                          error.message?.includes('limit');
      
      if (isRateLimit && attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Rate limit, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (attempt < maxRetries - 1) {
        continue;
      }
    }
  }
  
  console.error('❌ All Gemini models failed for resume parsing');
  return getDefaultParsedData();
};

const getDefaultParsedData = () => ({
  name: '',
  email: '',
  phone: '',
  detectedJobRole: 'Software Developer',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  languages: [],
  summary: '',
  yearsOfExperience: 0,
  educationLevel: '',
  parsingConfidence: 'low'
});

module.exports = {
  extractTextFromFile,
  parseResumeWithGemini,
  GEMINI_MODELS
};