"use client";

import { useRef, useContext } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial, useAspect } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { fragmentShader, vertexShader } from "../shaders";
import { VideoSliderContext } from "@/context/hero-context";

gsap.registerPlugin(useGSAP);

const ComplexShaderMaterial = shaderMaterial(
  {
    uTexture1: new THREE.Texture(),
    uTexture2: new THREE.Texture(),
    uOffsetAmount: 3,
    uColumnsCount: 3.0,
    uTransitionProgress: 0.0,
    uAngle: (45 * Math.PI) / 180,
    uScale: 3,
    uInputResolution: new THREE.Vector2(1920, 1080),
    uOutputResolution: new THREE.Vector2(1, 1),
  },
  vertexShader,
  fragmentShader
);
extend({ ComplexShaderMaterial });

function ShaderPlane({ texturesRef, progressRef }) {
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
}

const CanvasContainer = () => {
  const ctx = useContext(VideoSliderContext);
  const { texturesRef, progressRef } = ctx;

  return (
    <Canvas camera={{ position: [0, 0, 2], fov: 100 }}>
      <ShaderPlane texturesRef={texturesRef} progressRef={progressRef} />
    </Canvas>
  );
};

export default CanvasContainer;
