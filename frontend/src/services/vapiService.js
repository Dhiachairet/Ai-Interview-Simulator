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
    this.currentVapiCallId = null;
    
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
      console.log('✅ Vapi service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
      return false;
    }
  }

  setupEventListeners() {
    if (!this.vapi) return;

    this.vapi.on('call-start', (call) => {
      console.log('📞 Interview call started', call);
      this.isCallActive = true;
      
      if (call && call.id) {
        this.currentVapiCallId = call.id;
        console.log('✅ Call ID from call-start event:', this.currentVapiCallId);
      }
      
      this.onCallStart?.();
    });

    this.vapi.on('call-end', (call) => {
      console.log('🔚 Interview call ended', call);
      this.isCallActive = false;
      
      const vapiCallId = call?.id || this.currentVapiCallId;
      console.log('Ended Call ID:', vapiCallId);
      
      if (vapiCallId && this.onCallEnd) {
        this.onCallEnd(vapiCallId);
      } else if (this.onCallEnd) {
        this.onCallEnd();
      }
      
      this.currentCall = null;
    });

    this.vapi.on('message', (message) => {
      console.log('💬 Message:', message);
      this.onMessage?.(message);
    });

    this.vapi.on('user-speech', (transcript) => {
      console.log('🎤 User said:', transcript);
      this.onTranscript?.({ type: 'user', text: transcript });
    });

    this.vapi.on('assistant-speech', (transcript) => {
      console.log('🤖 Assistant said:', transcript);
      this.onTranscript?.({ type: 'assistant', text: transcript });
    });

    this.vapi.on('status-update', (statusUpdate) => {
      console.log('🔄 Status update:', statusUpdate);
      
      if (statusUpdate.call && statusUpdate.call.id && !this.currentVapiCallId) {
        this.currentVapiCallId = statusUpdate.call.id;
        console.log('✅ Call ID from status-update:', this.currentVapiCallId);
      }
      
      this.onStatusUpdate?.(statusUpdate);
    });

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

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    console.log(`🎤 Starting interview with ${assistantPersonality} for ${jobRole}`);

    try {
      const result = await this.vapi.start(assistantId, {
        variableValues: {
          jobRole: jobRole,
          difficulty: difficulty,
          personality: assistantPersonality
        },
        metadata: {
          userId: user?.id,
          jobRole: jobRole,
          personality: assistantPersonality,
          difficulty: difficulty
        }
      });
      
      console.log('Vapi start result:', result);
      
      if (result && result.id) {
        this.currentVapiCallId = result.id;
        console.log('✅ Call ID captured from start result:', this.currentVapiCallId);
      }
      
      this.currentCall = {
        assistantId,
        personality: assistantPersonality,
        jobRole,
        difficulty,
        startedAt: new Date(),
        vapiCallId: result?.id || null
      };
      
      return { 
        success: true, 
        callId: result?.id,
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
      console.log('Interview stopped - currentVapiCallId:', this.currentVapiCallId);
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

  getCurrentVapiCallId() {
    return this.currentVapiCallId;
  }

  getCurrentCall() {
    return this.currentCall;
  }

  isActive() {
    return this.isCallActive;
  }

  isAssistantSpeaking() {
    return this.vapi ? this.vapi.isSpeaking() : false;
  }
}

const vapiService = new VapiInterviewService();
export default vapiService;