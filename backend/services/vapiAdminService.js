class VapiAdminService {
  constructor() {
    this.apiKey = process.env.VAPI_PRIVATE_KEY;
    this.baseUrl = 'https://api.vapi.ai';
  }

  // Helper for fetch requests
  async _fetch(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Get all assistants
  async getAssistants() {
    try {
      const data = await this._fetch('/assistant');
      return data;
    } catch (error) {
      console.error('Error fetching assistants:', error.message);
      throw error;
    }
  }

  // Get specific assistant by ID
  async getAssistant(assistantId) {
    try {
      const data = await this._fetch(`/assistant/${assistantId}`);
      return data;
    } catch (error) {
      console.error('Error fetching assistant:', error.message);
      throw error;
    }
  }

  // Update assistant configuration
  async updateAssistant(assistantId, config) {
    try {
      const data = await this._fetch(`/assistant/${assistantId}`, {
        method: 'PATCH',
        body: JSON.stringify(config)
      });
      return data;
    } catch (error) {
      console.error('Error updating assistant:', error.message);
      throw error;
    }
  }

  // Update assistant prompt (first message, system prompt, behavior rules)
  async updateAssistantPrompt(assistantId, { firstMessage, systemPrompt, behaviorRules = [] }) {
    const updatePayload = {};
    
    if (firstMessage !== undefined) {
      updatePayload.firstMessage = firstMessage;
    }
    
    if (systemPrompt !== undefined) {
      let fullPrompt = systemPrompt;
      if (behaviorRules.length > 0) {
        fullPrompt += '\n\nBEHAVIOR RULES:\n' + behaviorRules.map(r => `- ${r}`).join('\n');
      }
      
      updatePayload.model = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: fullPrompt }]
      };
    }
    
    return this.updateAssistant(assistantId, updatePayload);
  }
}



module.exports = new VapiAdminService();