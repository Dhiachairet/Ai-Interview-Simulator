import Vapi from '@vapi-ai/web';

// Your actual Assistant IDs from Vapi dashboard
const ASSISTANT_IDS = {
  'Strict Technical': {
    withResume: 'fa324f31-0bdc-4de5-8e56-ee5a9ed1a9a2',  // STRICT TECHNICAL RESUME
    withoutResume: 'f16da004-e405-4757-985e-edcc7d6e6cdd'  // Strict technical
  },
  'Friendly HR': {
    withResume: 'da9344bf-169a-44a5-b760-4015ffc4b422',  // FRIENDLY HR RESUME
    withoutResume: '76c56042-f377-43a5-b972-46930aad2ef8'  // Friendly HR Interviewer
  },
  'Stress Tester': {
    withResume: '32be481e-89a4-4b08-a018-6c1aeece64e9',  // STRESS TESTER RESUME
    withoutResume: 'eb367fa4-9b4e-4a2c-b280-8e129607d170'  // Stress Tester Interviewer
  },
  'Theoretical Expert': {
    withResume: '73d488cd-6762-487f-96cc-f73099398efb',  // THEORETICAL EXPERT RESUME
    withoutResume: 'cb1b2e37-526a-468a-8d73-914b40743248'  // Theoretical Expert Interviewer
  }
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

  async startInterview(assistantPersonality, jobRole, difficulty = 'medium', resumeData = null) {
    if (!this.isInitialized || !this.vapi) {
      throw new Error('Vapi not initialized. Call initialize() first.');
    }

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    console.log(`🎤 Starting interview with ${assistantPersonality} for ${jobRole}`);
    console.log(`📄 Has resume context: ${!!resumeData}`);

    // Check if resume is valid
    const hasValidResume = resumeData && Object.keys(resumeData).length > 0 && resumeData.name;
    
    // ✅ SELECT THE CORRECT ASSISTANT BASED ON RESUME STATUS
    const assistantConfig = ASSISTANT_IDS[assistantPersonality];
    const assistantId = hasValidResume ? assistantConfig.withResume : assistantConfig.withoutResume;
    
    console.log(`🤖 Using assistant ID: ${assistantId} (${hasValidResume ? 'WITH Resume' : 'WITHOUT Resume'} mode)`);

    // Build variable values
    const variableValues = {
      jobRole: jobRole,
      difficulty: difficulty,
    };
    
    if (hasValidResume) {
      // Personal info
      variableValues.candidateName = resumeData.name || 'the candidate';
      
      const skills = resumeData.skills || [];
      variableValues.candidateSkills = skills.slice(0, 2).join(', ');
      variableValues.yearsOfExperience = resumeData.yearsOfExperience || '';
      
      const projects = resumeData.projects || [];
      if (projects.length > 0) {
        const primaryProject = projects[0];
        variableValues.primaryProject = primaryProject.name;
        variableValues.projectTech = primaryProject.technologies?.slice(0, 2).join(', ') || '';
      } else {
        variableValues.primaryProject = '';
        variableValues.projectTech = '';
      }
      
      const experience = resumeData.experience || [];
      if (experience.length > 0) {
        const primaryExp = experience[0];
        variableValues.primaryRole = primaryExp.title;
        variableValues.primaryCompany = primaryExp.company;
      } else {
        variableValues.primaryRole = '';
        variableValues.primaryCompany = '';
      }
      
      console.log('📄 Resume mode - using personalized prompts');
      console.log(`   Name: ${variableValues.candidateName}`);
      console.log(`   Skills: ${variableValues.candidateSkills}`);
      console.log(`   Years: ${variableValues.yearsOfExperience}`);
    } else {
      console.log('📄 Standard mode - using general prompts');
    }

    // Generate temp ID and save metadata
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const callMetadata = {
      vapiCallId: tempId,
      jobRole: jobRole,
      personality: assistantPersonality,
      difficulty: difficulty,
      startedAt: new Date().toISOString(),
      isTemp: true,
      hasResumeContext: hasValidResume
    };
    
    sessionStorage.setItem('currentInterviewData', JSON.stringify(callMetadata));
    localStorage.setItem(`interview_${tempId}`, JSON.stringify(callMetadata));
    console.log('✅ Saved temporary metadata');

    try {
      const result = await this.vapi.start(assistantId, {
        variableValues: variableValues,
        metadata: {
          userId: user?.id,
          jobRole: jobRole,
          personality: assistantPersonality,
          difficulty: difficulty,
          hasResumeContext: hasValidResume,
          resumeName: hasValidResume ? resumeData.name : ''
        }
      });
      
      console.log('Vapi start result:', result);
      
      if (result && result.id) {
        const realCallId = result.id;
        this.currentVapiCallId = realCallId;
        
        const updatedMetadata = {
          vapiCallId: realCallId,
          jobRole: jobRole,
          personality: assistantPersonality,
          difficulty: difficulty,
          startedAt: new Date().toISOString(),
          isTemp: false,
          hasResumeContext: hasValidResume
        };
        
        sessionStorage.setItem('currentInterviewData', JSON.stringify(updatedMetadata));
        localStorage.setItem(`interview_${realCallId}`, JSON.stringify(updatedMetadata));
        localStorage.removeItem(`interview_${tempId}`);
        
        console.log('✅ Updated with real call ID:', realCallId);
      }
      
      this.currentCall = {
        assistantId,
        personality: assistantPersonality,
        jobRole,
        difficulty,
        startedAt: new Date(),
        vapiCallId: result?.id || null,
        hasResumeContext: hasValidResume
      };
      
      return { 
        success: true, 
        callId: result?.id,
        message: `Interview started with ${assistantPersonality} interviewer for ${jobRole}`
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