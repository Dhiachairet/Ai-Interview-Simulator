import Vapi from '@vapi-ai/web';

// Your actual Assistant IDs from Vapi dashboard
const ASSISTANT_IDS = {
  'Strict Technical': '1262acb4-4ef5-4345-bbb2-e1084d72dc58',
  'Friendly HR': '037d8b84-edc1-4359-b8ea-1aa0f38e9409',
  'Stress Tester': '55c6ad9a-d936-4829-a013-f9989a357b73',
  'Theoretical Expert': 'e60a2586-c610-43cb-85f0-b74e1c36970c'
};

class VapiInterviewService {
  constructor() {
    this.vapi = null;
    this.isInitialized = false;
    this.currentCall = null;
    this.isCallActive = false;
    
    // Event callbacks
    this.onCallStart = null;
    this.onCallEnd = null;
    this.onTranscript = null;
    this.onStatusUpdate = null;
    this.onError = null;
    this.onMessage = null;
  }

  initialize(publicKey) {
    if (!publicKey) {
      console.error('Vapi public key is required');
      return false;
    }
    
    try {
      this.vapi = new Vapi(publicKey);
      this.isInitialized = true;
      this.setupEventListeners();
      console.log('Vapi service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
      return false;
    }
  }

  setupEventListeners() {
    if (!this.vapi) return;

    // Call started - FIXED: Use correct event names based on Vapi SDK
    this.vapi.on('call-start', () => {
      console.log('📞 Interview call started');
      this.isCallActive = true;
      this.onCallStart?.();
    });

    // Call ended - FIXED
    this.vapi.on('call-end', () => {
      console.log('🔚 Interview call ended');
      this.isCallActive = false;
      this.currentCall = null;
      this.onCallEnd?.();
    });

    // Message from assistant - This is what you need for conversation
    this.vapi.on('message', (message) => {
      console.log('💬 Assistant message:', message);
      this.onMessage?.(message);
    });

    // User transcript
    this.vapi.on('user-speech', (transcript) => {
      console.log('🎤 User said:', transcript);
      this.onTranscript?.({ type: 'user', text: transcript });
    });

    // Assistant transcript
    this.vapi.on('assistant-speech', (transcript) => {
      console.log('🤖 Assistant said:', transcript);
      this.onTranscript?.({ type: 'assistant', text: transcript });
    });

    // Status updates
    this.vapi.on('status-update', (status) => {
      console.log('🔄 Status:', status);
      this.onStatusUpdate?.(status);
    });

    // Errors
    this.vapi.on('error', (error) => {
      console.error('❌ Vapi error:', error);
      this.onError?.(error);
    });
  }

  async startInterview(assistantPersonality, jobRole, difficulty = 'medium') {
  if (!this.isInitialized || !this.vapi) {
    throw new Error('Vapi not initialized. Call initialize() first.');
  }

  const assistantId = ASSISTANT_IDS[assistantPersonality];
  
  if (!assistantId) {
    throw new Error(`No assistant found for personality: ${assistantPersonality}`);
  }

  // Get current user from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  console.log(`🎤 Starting interview with ${assistantPersonality} for ${jobRole} at ${difficulty} level`);
  console.log(`User ID: ${user?.id}`);

  try {
    await this.vapi.start(assistantId, {
      variableValues: {
        jobRole: jobRole,
        difficulty: difficulty
      },
      metadata: {
        userId: user?.id,
        jobRole: jobRole,
        personality: assistantPersonality,
        difficulty: difficulty
      }
    });
    
    this.currentCall = {
      assistantId,
      personality: assistantPersonality,
      jobRole,
      difficulty,
      startedAt: new Date()
    };
    
    return { 
      success: true, 
      callId: this.currentCall,
      message: `Interview started with ${assistantPersonality} interviewer`
    };
  } catch (error) {
    console.error('Failed to start interview:', error);
    throw error;
  }
}
  stopInterview() {
    if (this.vapi && this.isCallActive) {
      this.vapi.stop();
      this.isCallActive = false;
      this.currentCall = null;
      console.log('Interview stopped');
    }
  }

  setMuted(muted) {
    if (this.vapi) {
      this.vapi.setMuted(muted);
    }
  }

  isMuted() {
    return this.vapi ? this.vapi.isMuted() : false;
  }

  toggleMute() {
    if (this.vapi) {
      const current = this.vapi.isMuted();
      this.vapi.setMuted(!current);
      return !current;
    }
    return false;
  }

  getCurrentCall() {
    return this.currentCall;
  }

  isActive() {
    return this.isCallActive;
  }

  // New method to check if assistant is speaking
  isAssistantSpeaking() {
    return this.vapi ? this.vapi.isSpeaking() : false;
  }
}

// Create singleton instance
const vapiService = new VapiInterviewService();

export default vapiService;