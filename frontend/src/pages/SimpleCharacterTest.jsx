import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

// Simple cube component to test 3D rendering
const TestCube = () => {
  return (
    <mesh rotation={[0.5, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
};

const SimpleCharacterTest = () => {
  const [show3D, setShow3D] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Simple 3D Test
        </h1>

        {/* 3D Canvas */}
        <div style={{ width: '100%', height: '400px', background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
          <Canvas camera={{ position: [2, 2, 5] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <TestCube />
            <OrbitControls />
          </Canvas>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white mb-4">
            If you see a blue cube above, 3D rendering is working!
          </p>
          <button
            onClick={() => setShow3D(!show3D)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Toggle 3D
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCharacterTest;