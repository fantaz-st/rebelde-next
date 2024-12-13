import * as THREE from "three";
import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAspect } from "@react-three/drei";
import { useHero } from "@/context/hero-context";

const ShaderPlane = ({ texturesRef, progressRef }) => {
  const materialRef = useRef();
  const { viewport } = useThree();
  const scale = useAspect(viewport.width, viewport.height, 1);

  useFrame(() => {
    if (materialRef.current && texturesRef.current.length === 2) {
      materialRef.current.uTexture1 = texturesRef.current[0];
      materialRef.current.uTexture2 = texturesRef.current[1];
      materialRef.current.uTransitionProgress = progressRef.current;
      materialRef.current.uOffsetAmount = 3;
      materialRef.current.uColumnsCount = 3.0;
      materialRef.current.uAngle = (45 * Math.PI) / 180;
      materialRef.current.uScale = 3;
      materialRef.current.uInputResolution = new THREE.Vector2(16, 9);
      materialRef.current.uOutputResolution = scale.slice(0, 2);
    }
  });

  return (
    <mesh scale={scale}>
      <planeGeometry args={[1, 1]} />
      <complexShaderMaterial ref={materialRef} />
    </mesh>
  );
};

const CanvasWrapper = () => {
  const { texturesRef, progressRef } = useHero();

  return (
    <Canvas camera={{ position: [0, 0, 2], fov: 100 }}>
      <ShaderPlane texturesRef={texturesRef} progressRef={progressRef} />
    </Canvas>
  );
};

export default CanvasWrapper;
