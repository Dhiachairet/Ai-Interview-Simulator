const Resume = require('../models/Resume');
const { extractTextFromFile, parseResumeWithGemini } = require('../services/resumeParser');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
}).single('resume');

// @desc    Upload and parse resume
// @route   POST /api/resume/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      
      console.log('📄 Processing resume:', req.file.originalname);
      
      // Extract text from file
      const extractedText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
      
      if (!extractedText || extractedText.length < 50) {
        return res.status(400).json({ 
          success: false, 
          error: 'Could not extract text from resume. Please ensure the file contains readable text.' 
        });
      }
      
      console.log('✅ Text extracted, length:', extractedText.length);
      
      // Parse with Gemini (handles model rotation automatically)
      const parsedData = await parseResumeWithGemini(extractedText);
      
      console.log('✅ Resume parsed, detected role:', parsedData.detectedJobRole);
      console.log('   Confidence:', parsedData.parsingConfidence);
      console.log('   Skills:', parsedData.skills.length);
      console.log('   Experience:', parsedData.experience.length);
      
      // Save to database
      const resume = await Resume.findOneAndUpdate(
        { user: req.user.id },
        {
          user: req.user.id,
          fileName: req.file.originalname,
          extractedText: extractedText.substring(0, 5000),
          parsedData: parsedData,
          isActive: true
        },
        { upsert: true, new: true }
      );
      
      res.status(200).json({
        success: true,
        data: {
          id: resume._id,
          parsedData: resume.parsedData,
          fileName: resume.fileName
        }
      });
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get user's resume
// @route   GET /api/resume
// @access  Private
const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user.id, isActive: true });
    res.status(200).json({
      success: true,
      data: resume || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resume
// @access  Private
const deleteResume = async (req, res) => {
  try {
    await Resume.findOneAndDelete({ user: req.user.id });
    res.status(200).json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  uploadResume,
  getResume,
  deleteResume
};