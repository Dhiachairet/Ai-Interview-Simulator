import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Html, Text3D, OrbitControls, Environment, Sparkles, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

// High-detail Character Model
const HighDetailCharacter = ({ emotion, isTalking, personality }) => {
  const groupRef = useRef();
  const headRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const mouthRef = useRef();
  const leftEyebrowRef = useRef();
  const rightEyebrowRef = useRef();
  const bodyRef = useRef();
  const tieRef = useRef();
  const glassesRef = useRef();
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Character colors based on personality with metallic effects
  const colors = {
    professional: {
      skin: '#f8d5b0',
      suit: '#1a2634',
      suitShine: '#2c3e50',
      tie: '#c0392b',
      tieShine: '#e74c3c',
      eyes: '#2c3e50',
      hair: '#2c3e50',
      shirt: '#ecf0f1'
    },
    friendly: {
      skin: '#fde3a7',
      suit: '#2980b9',
      suitShine: '#3498db',
      tie: '#f39c12',
      tieShine: '#f1c40f',
      eyes: '#2c3e50',
      hair: '#8B4513',
      shirt: '#ecf0f1'
    },
    strict: {
      skin: '#d5b185',
      suit: '#2c3e50',
      suitShine: '#34495e',
      tie: '#7f8c8d',
      tieShine: '#95a5a6',
      eyes: '#1a2634',
      hair: '#000000',
      shirt: '#bdc3c7'
    }
  };

  const currentColors = colors[personality] || colors.professional;

  // Mouse move effect for character to follow cursor slightly
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      const y = (e.clientY / window.innerHeight - 0.5) * 0.3;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Complex animation frame with multiple effects
  useFrame((state) => {
    if (groupRef.current) {
      // Smooth follow mouse
      groupRef.current.rotation.y += (mousePosition.x - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (mousePosition.y - groupRef.current.rotation.x) * 0.05;
      
      // Idle floating animation
      groupRef.current.position.y = -1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }

    if (headRef.current) {
      // Subtle head movement
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      headRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.03;
    }

    // Realistic eye blinking
    if (leftEyeRef.current && rightEyeRef.current) {
      const blinkSpeed = 3;
      const blinkThreshold = 0.98;
      const blink = Math.sin(state.clock.elapsedTime * blinkSpeed) > blinkThreshold;
      
      leftEyeRef.current.scale.y = blink ? 0.1 : 1;
      rightEyeRef.current.scale.y = blink ? 0.1 : 1;
    }

    // Advanced talking animation
    if (isTalking && mouthRef.current) {
      const time = state.clock.elapsedTime * 15;
      mouthRef.current.scale.y = 0.5 + Math.sin(time) * 0.4;
      mouthRef.current.scale.x = 1 + Math.sin(time * 1.3) * 0.15;
      mouthRef.current.position.y = -0.05 + Math.sin(time) * 0.03;
    }

    // Emotion-based expressions with smooth transitions
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
      const targetRotation = (() => {
        switch(emotion) {
          case 'happy': return 0.15;
          case 'thinking': return -0.25;
          case 'surprised': return 0.35;
          case 'concerned': return 0.2;
          default: return 0;
        }
      })();

      leftEyebrowRef.current.rotation.z += (targetRotation - leftEyebrowRef.current.rotation.z) * 0.1;
      rightEyebrowRef.current.rotation.z += (-targetRotation - rightEyebrowRef.current.rotation.z) * 0.1;
    }

    // Tie movement
    if (tieRef.current) {
      tieRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Enhanced Body with metallic suit */}
      <group ref={bodyRef}>
        {/* Main torso */}
        <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.8, 0.7]} />
          <meshStandardMaterial 
            color={currentColors.suit}
            roughness={0.3}
            metalness={0.4}
            emissive={new THREE.Color(0x000000)}
          />
        </mesh>
        
        {/* Suit jacket lapels */}
        <mesh position={[-0.3, 0, 0.36]} rotation={[0, 0, -0.1]} castShadow>
          <boxGeometry args={[0.3, 0.6, 0.1]} />
          <meshStandardMaterial color={currentColors.suitShine} roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0.3, 0, 0.36]} rotation={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.3, 0.6, 0.1]} />
          <meshStandardMaterial color={currentColors.suitShine} roughness={0.2} metalness={0.3} />
        </mesh>

        {/* Detailed shirt */}
        <mesh position={[0, -0.2, 0.4]} castShadow>
          <boxGeometry args={[0.8, 0.7, 0.1]} />
          <meshStandardMaterial color={currentColors.shirt} roughness={0.5} />
        </mesh>

        {/* Enhanced tie with 3D effect */}
        <group ref={tieRef} position={[0, -0.2, 0.45]}>
          <mesh castShadow>
            <coneGeometry args={[0.22, 0.7, 16]} />
            <meshStandardMaterial 
              color={currentColors.tie}
              roughness={0.2}
              metalness={0.3}
              emissive={new THREE.Color(0x000000)}
            />
          </mesh>
          <mesh position={[0, 0.2, 0.02]} castShadow>
            <boxGeometry args={[0.15, 0.15, 0.05]} />
            <meshStandardMaterial color={currentColors.tieShine} roughness={0.1} metalness={0.5} />
          </mesh>
        </group>

        {/* Shirt buttons */}
        {[-0.3, 0, 0.3].map((y, i) => (
          <mesh key={i} position={[0, y, 0.45]} castShadow>
            <sphereGeometry args={[0.04, 16]} />
            <meshStandardMaterial color="#f1c40f" roughness={0.1} metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Detailed neck */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.25, 32]} />
        <meshStandardMaterial color={currentColors.skin} roughness={0.3} />
      </mesh>

      {/* High-detail head */}
      <group ref={headRef} position={[0, 0.65, 0]}>
        {/* Main head with subsurface scattering effect */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.55, 64, 64]} />
          <meshStandardMaterial 
            color={currentColors.skin}
            roughness={0.25}
            emissive={new THREE.Color(0x221100)}
          />
        </mesh>

        {/* Detailed hair with multiple layers */}
        <group>
          <mesh position={[0, 0.3, 0.15]} castShadow>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial color={currentColors.hair} roughness={0.4} />
          </mesh>
          <mesh position={[-0.2, 0.3, 0.2]} castShadow>
            <sphereGeometry args={[0.2, 16]} />
            <meshStandardMaterial color={currentColors.hair} roughness={0.4} />
          </mesh>
          <mesh position={[0.2, 0.3, 0.2]} castShadow>
            <sphereGeometry args={[0.2, 16]} />
            <meshStandardMaterial color={currentColors.hair} roughness={0.4} />
          </mesh>
        </group>

        {/* Detailed ears */}
        <mesh position={[-0.55, 0.05, 0]} castShadow>
          <sphereGeometry args={[0.15, 32]} />
          <meshStandardMaterial color={currentColors.skin} roughness={0.3} />
        </mesh>
        <mesh position={[0.55, 0.05, 0]} castShadow>
          <sphereGeometry args={[0.15, 32]} />
          <meshStandardMaterial color={currentColors.skin} roughness={0.3} />
        </mesh>

        {/* Advanced eye system */}
        <group position={[-0.2, 0.15, 0.5]}>
          <mesh ref={leftEyeRef} castShadow>
            <sphereGeometry args={[0.1, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          <mesh position={[0.02, 0.02, 0.03]}>
            <sphereGeometry args={[0.05, 16]} />
            <meshStandardMaterial color={currentColors.eyes} />
          </mesh>
          <mesh position={[0.04, 0.04, 0.05]}>
            <sphereGeometry args={[0.02, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
        
        <group position={[0.2, 0.15, 0.5]}>
          <mesh ref={rightEyeRef} castShadow>
            <sphereGeometry args={[0.1, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          <mesh position={[-0.02, 0.02, 0.03]}>
            <sphereGeometry args={[0.05, 16]} />
            <meshStandardMaterial color={currentColors.eyes} />
          </mesh>
          <mesh position={[-0.04, 0.04, 0.05]}>
            <sphereGeometry args={[0.02, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Enhanced eyebrows */}
        <mesh ref={leftEyebrowRef} position={[-0.2, 0.27, 0.5]} castShadow>
          <boxGeometry args={[0.16, 0.04, 0.08]} />
          <meshStandardMaterial color={currentColors.hair} roughness={0.3} />
        </mesh>
        <mesh ref={rightEyebrowRef} position={[0.2, 0.27, 0.5]} castShadow>
          <boxGeometry args={[0.16, 0.04, 0.08]} />
          <meshStandardMaterial color={currentColors.hair} roughness={0.3} />
        </mesh>

        {/* Detailed mouth */}
        <group position={[0, -0.1, 0.52]}>
          <mesh ref={mouthRef} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.14, 0.03, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#e74c3c" roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.02, 0.02]}>
            <sphereGeometry args={[0.02, 8]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
        </group>

        {/* Detailed nose */}
        <mesh position={[0, 0.02, 0.55]} castShadow>
          <coneGeometry args={[0.07, 0.12, 16]} />
          <meshStandardMaterial color={currentColors.skin} roughness={0.3} />
        </mesh>

        {/* High-end glasses for strict personality */}
        {personality === 'strict' && (
          <group ref={glassesRef}>
            <mesh position={[-0.2, 0.17, 0.53]}>
              <torusGeometry args={[0.12, 0.02, 16, 32]} />
              <meshStandardMaterial color="#c0392b" roughness={0.1} metalness={0.9} />
            </mesh>
            <mesh position={[0.2, 0.17, 0.53]}>
              <torusGeometry args={[0.12, 0.02, 16, 32]} />
              <meshStandardMaterial color="#c0392b" roughness={0.1} metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.17, 0.53]}>
              <boxGeometry args={[0.4, 0.03, 0.02]} />
              <meshStandardMaterial color="#c0392b" roughness={0.1} metalness={0.9} />
            </mesh>
          </group>
        )}

        {/* Facial hair option for professional */}
        {personality === 'professional' && (
          <mesh position={[0, -0.05, 0.52]}>
            <sphereGeometry args={[0.1, 8]} />
            <meshStandardMaterial color="#2c3e50" roughness={0.8} />
          </mesh>
        )}
      </group>

      {/* Detailed arms */}
      <group position={[-0.8, 0.1, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.9, 16]} />
          <meshStandardMaterial color={currentColors.suit} roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <sphereGeometry args={[0.18, 16]} />
          <meshStandardMaterial color={currentColors.skin} roughness={0.3} />
        </mesh>
      </group>
      
      <group position={[0.8, 0.1, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.9, 16]} />
          <meshStandardMaterial color={currentColors.suit} roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <sphereGeometry args={[0.18, 16]} />
          <meshStandardMaterial color={currentColors.skin} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

// Main Component with enhanced graphics
const InterviewCharacter3D = ({ 
  isActive = false, 
  emotion = 'neutral',
  isTalking = false,
  personality = 'professional',
  message = ''
}) => {
  const { scale, position, opacity } = useSpring({
    scale: isActive ? 1 : 0,
    position: isActive ? [0, 0, 0] : [0, -3, 0],
    opacity: isActive ? 1 : 0,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  if (!isActive) return null;

  return (
    <div style={{ 
      position: 'fixed',
      left: 0,
      top: 0,
      width: '50vw', // Half the page width
      height: '100vh',
      zIndex: 1000,
      pointerEvents: 'none',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)'
      }} />
      
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        shadows
      >
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-5, 2, 3]} intensity={0.5} />
        <pointLight position={[0, 3, 3]} intensity={0.3} />
        
        {/* Studio lighting effect */}
        <spotLight
          position={[0, 5, 5]}
          angle={0.5}
          penumbra={0.5}
          intensity={0.8}
          castShadow
        />
        
        {/* Background glow */}
        <pointLight position={[0, 0, 2]} intensity={0.2} color="#667eea" />
        
        {/* Environment map for reflections */}
        <Environment preset="city" />
        
        {/* Sparkles for magical effect */}
        <Sparkles 
          count={20}
          scale={4}
          size={2}
          speed={0.4}
          color={personality === 'friendly' ? '#f1c40f' : personality === 'strict' ? '#e74c3c' : '#3498db'}
        />

        {/* Reflective floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={2048}
            mixBlur={1}
            mixStrength={40}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#7f8c8d"
            metalness={0.5}
          />
        </mesh>

        <animated.group scale={scale} position={position}>
          <HighDetailCharacter 
            emotion={emotion}
            isTalking={isTalking}
            personality={personality}
          />
        </animated.group>

        {/* Floating particles around character */}
        <Sparkles
          count={5}
          scale={2}
          size={1}
          speed={0.3}
          color="white"
          position={[0, 1, 0]}
        />

        {/* Speech Bubble with enhanced styling */}
        {message && (
          <Html position={[2, 2.2, 0]} center>
            <div className="speech-bubble-enhanced">
              <p>{message}</p>
              <div className="bubble-tail-enhanced"></div>
            </div>
          </Html>
        )}
      </Canvas>

      {/* Character name/title */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        background: 'rgba(0,0,0,0.3)',
        padding: '10px 30px',
        borderRadius: '50px',
        backdropFilter: 'blur(5px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {personality === 'friendly' ? '😊 AI Coach' : 
         personality === 'strict' ? '⚠️ Interviewer' : '👔 AI Professional'}
      </div>
    </div>
  );
};

export default InterviewCharacter3D;