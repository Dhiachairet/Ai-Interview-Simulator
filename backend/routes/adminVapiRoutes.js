const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const vapiAdminService = require('../services/vapiAdminService');

// Get all assistants
router.get('/vapi/assistants', protect, adminOnly, async (req, res) => {
  try {
    const assistants = await vapiAdminService.getAssistants();
    res.json({ success: true, data: assistants });
  } catch (error) {
    console.error('Error fetching assistants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific assistant
router.get('/vapi/assistants/:id', protect, adminOnly, async (req, res) => {
  try {
    const assistant = await vapiAdminService.getAssistant(req.params.id);
    res.json({ success: true, data: assistant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update assistant prompt
router.put('/vapi/assistants/:id/prompt', protect, adminOnly, async (req, res) => {
  try {
    const { firstMessage, systemPrompt, behaviorRules } = req.body;
    
    const updated = await vapiAdminService.updateAssistantPrompt(
      req.params.id,
      { firstMessage, systemPrompt, behaviorRules }
    );
    
    res.json({ success: true, data: updated, message: 'Assistant updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to verify Vapi API is working
router.get('/vapi/test', protect, adminOnly, async (req, res) => {
  try {
    const assistants = await vapiAdminService.getAssistants();
    res.json({ 
      success: true, 
      message: 'Vapi API is working!',
      count: assistants.length,
      assistants: assistants.map(a => ({ id: a.id, name: a.name }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this to your existing adminVapiRoutes.js

// Create a new assistant
router.post('/vapi/assistants', protect, adminOnly, async (req, res) => {
  try {
    const { name, firstMessage, systemPrompt, voice, model } = req.body;
    
    const newAssistant = await vapiAdminService.createAssistant({
      name: name,
      firstMessage: firstMessage,
      model: {
        provider: 'openai',
        model: model,
        messages: [{ role: 'system', content: systemPrompt }]
      },
      voice: {
        provider: 'vapi',
        voiceId: voice
      }
    });
    
    res.json({ success: true, data: newAssistant, message: 'Assistant created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



module.exports = router;