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
    const m = materialRef.current;
    if (!m || texturesRef.current.length < 2) return;
    m.uTexture1 = texturesRef.current[0];
    m.uTexture2 = texturesRef.current[1];
    m.uTransitionProgress = progressRef.current;
    m.uOffsetAmount = 3;
    m.uColumnsCount = 3.0;
    m.uAngle = (45 * Math.PI) / 180;
    m.uScale = 3;
    m.uInputResolution = new THREE.Vector2(16, 9);
    m.uOutputResolution = scale.slice(0, 2);
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
    <Canvas dpr={[1, 2]} gl={{ powerPreference: "high-performance", antialias: true }} camera={{ position: [0, 0, 2], fov: 100 }}>
      <ShaderPlane texturesRef={texturesRef} progressRef={progressRef} />
    </Canvas>
  );
};

export default CanvasWrapper;
