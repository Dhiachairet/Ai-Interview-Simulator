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

  async startInterview(assistantPersonality, jobRole, difficulty = 'medium', resumeData = null) {
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
    console.log(`📄 Has resume context: ${!!resumeData}`);

    // Build variable values - ALWAYS include jobRole and difficulty
    const variableValues = {
      jobRole: jobRole,
      difficulty: difficulty,
      personality: assistantPersonality
    };
    
    // ✅ Add resume context variables if resume data is provided
    if (resumeData && Object.keys(resumeData).length > 0) {
      // Personal information
      variableValues.candidateName = resumeData.name || 'the candidate';
      variableValues.candidateEmail = resumeData.email || '';
      variableValues.candidatePhone = resumeData.phone || '';
      
      // Skills
      variableValues.candidateSkills = resumeData.skills?.length > 0 
        ? resumeData.skills.join(', ') 
        : '';
      
      // Experience - format nicely for the prompt
      variableValues.candidateExperience = resumeData.experience?.length > 0
        ? resumeData.experience.map(exp => {
            let expText = `${exp.title} at ${exp.company}`;
            if (exp.duration) expText += ` (${exp.duration})`;
            if (exp.description) expText += `: ${exp.description}`;
            return expText;
          }).join('\n')
        : '';
      
      // Projects
      variableValues.candidateProjects = resumeData.projects?.length > 0
        ? resumeData.projects.map(proj => {
            let projText = `${proj.name}`;
            if (proj.description) projText += `: ${proj.description}`;
            if (proj.technologies?.length) projText += ` [${proj.technologies.join(', ')}]`;
            return projText;
          }).join('\n')
        : '';
      
      // Education
      variableValues.candidateEducation = resumeData.education?.length > 0
        ? resumeData.education.map(edu => {
            let eduText = `${edu.degree} at ${edu.institution}`;
            if (edu.year) eduText += ` (${edu.year})`;
            return eduText;
          }).join('\n')
        : '';
      
      // Certifications
      variableValues.candidateCertifications = resumeData.certifications?.length > 0
        ? resumeData.certifications.join(', ')
        : '';
      
      // Languages
      variableValues.candidateLanguages = resumeData.languages?.length > 0
        ? resumeData.languages.join(', ')
        : '';
      
      // Summary / Bio
      variableValues.candidateSummary = resumeData.summary || '';
      
      // Years of experience
      variableValues.yearsOfExperience = resumeData.yearsOfExperience || '';
      
      // Education level
      variableValues.educationLevel = resumeData.educationLevel || '';
      
      console.log('📄 Resume context added:');
      console.log(`   Name: ${variableValues.candidateName}`);
      console.log(`   Skills: ${variableValues.candidateSkills?.substring(0, 100)}...`);
      console.log(`   Experience: ${resumeData.experience?.length || 0} entries`);
      console.log(`   Projects: ${resumeData.projects?.length || 0} entries`);
    }

    // Generate a TEMPORARY ID immediately (before Vapi responds)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Save metadata with temp ID IMMEDIATELY
    const callMetadata = {
      vapiCallId: tempId,
      jobRole: jobRole,
      personality: assistantPersonality,
      difficulty: difficulty,
      startedAt: new Date().toISOString(),
      isTemp: true,
      hasResumeContext: !!resumeData
    };
    
    // Save to BOTH storage types
    sessionStorage.setItem('currentInterviewData', JSON.stringify(callMetadata));
    localStorage.setItem(`interview_${tempId}`, JSON.stringify(callMetadata));
    console.log('✅ Saved TEMPORARY metadata:', callMetadata);

    try {
      const result = await this.vapi.start(assistantId, {
        variableValues: variableValues,
        metadata: {
          userId: user?.id,
          jobRole: jobRole,
          personality: assistantPersonality,
          difficulty: difficulty,
          hasResumeContext: !!resumeData,
          resumeName: resumeData?.name || '',
          resumeSkills: resumeData?.skills?.slice(0, 5) || []
        }
      });
      
      console.log('Vapi start result:', result);
      
      // Update metadata with REAL call ID
      if (result && result.id) {
        const realCallId = result.id;
        this.currentVapiCallId = realCallId;
        
        // Update metadata with real ID
        const updatedMetadata = {
          vapiCallId: realCallId,
          jobRole: jobRole,
          personality: assistantPersonality,
          difficulty: difficulty,
          startedAt: new Date().toISOString(),
          isTemp: false,
          hasResumeContext: !!resumeData
        };
        
        // Save updated metadata
        sessionStorage.setItem('currentInterviewData', JSON.stringify(updatedMetadata));
        localStorage.setItem(`interview_${realCallId}`, JSON.stringify(updatedMetadata));
        
        // Clean up temp entry
        localStorage.removeItem(`interview_${tempId}`);
        
        console.log('✅ Updated metadata with REAL call ID:', realCallId);
      }
      
      this.currentCall = {
        assistantId,
        personality: assistantPersonality,
        jobRole,
        difficulty,
        startedAt: new Date(),
        vapiCallId: result?.id || null,
        hasResumeContext: !!resumeData
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