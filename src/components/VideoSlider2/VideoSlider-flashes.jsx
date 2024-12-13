"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial, useAspect } from "@react-three/drei";
import gsap from "gsap";
import classes from "./VideoSlider.module.css";
import slides from "./data";
import { fragmentShader, vertexShader } from "./shaders";

const ComplexShaderMaterial = shaderMaterial(
  {
    uTexture1: new THREE.Texture(),
    uTexture2: new THREE.Texture(),
    uOffsetAmount: 3,
    uColumnsCount: 3.0,
    uTransitionProgress: 0.0,
    uAngle: (45 * Math.PI) / 180,
    uScale: 3,
    uInputResolution: new THREE.Vector2(16, 9),
    uOutputResolution: new THREE.Vector2(1, 1),
  },
  vertexShader,
  fragmentShader
);
extend({ ComplexShaderMaterial });

async function fetchVideoWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

  const reader = response.body.getReader();
  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  let loaded = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (total && onProgress) {
      onProgress((loaded / total) * 100);
    }
  }

  const blob = new Blob(chunks);
  return URL.createObjectURL(blob);
}

function createVideoTextureFromBlobURL(blobURL) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = blobURL;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;

    video.oncanplay = () => {
      video
        .play()
        .then(() => {
          const texture = new THREE.VideoTexture(video);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          resolve(texture);
        })
        .catch(reject);
    };
    video.onerror = () => reject(new Error(`Failed to load video from ${blobURL}`));
  });
}

async function createVideoTexture(url, onProgress) {
  const blobURL = await fetchVideoWithProgress(url, onProgress);
  return createVideoTextureFromBlobURL(blobURL);
}

function disposeTexture(texture) {
  if (texture && texture.image && texture.image.tagName === "VIDEO") {
    texture.image.pause();
    texture.image.src = "";
    texture.image.load();
  }
  texture.dispose();
}

// Hook to load all initial video textures
function useVideoTextures(slides) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const texturesRef = useRef([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        for (let i = 0; i < slides.length; i++) {
          const tex = await createVideoTexture(slides[i].video, (p) => {
            if (isMounted) setProgress(p);
          });
          texturesRef.current.push(tex);
        }
        if (isMounted) {
          setLoading(false);
          setProgress(100);
        }
      } catch (err) {
        console.error("Error loading videos:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [slides]);

  return { texturesRef, loading, progress };
}

function ShaderPlane({ transitionProgressRef, currentTextures }) {
  const materialRef = useRef();
  const { viewport } = useThree();
  const scale = useAspect(viewport.width, viewport.height, 1);

  useFrame(() => {
    if (!materialRef.current || currentTextures.length < 2) return;
    materialRef.current.uTexture1 = currentTextures[0];
    materialRef.current.uTexture2 = currentTextures[1];
    materialRef.current.uTransitionProgress = transitionProgressRef.current;
    materialRef.current.uOutputResolution = new THREE.Vector2(scale[0], scale[1]);
  });

  return (
    <mesh scale={scale}>
      <planeGeometry args={[1, 1]} />
      <complexShaderMaterial ref={materialRef} />
    </mesh>
  );
}

export default function VideoSlider() {
  const containerRef = useRef(null);
  const transitionProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const currentIndexRef = useRef(-1);
  const { texturesRef, loading, progress } = useVideoTextures(slides);

  // Create a transparent pixel texture initially
  const transparentTexture = useRef(null);
  if (!transparentTexture.current) {
    const data = new Uint8Array([0, 0, 0, 0]); // Transparent pixel RGBA
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    transparentTexture.current = tex;
  }

  const [currentTextures, setCurrentTextures] = useState([transparentTexture.current, transparentTexture.current]);

  const controlsRef = useRef(null);
  const [controls, setControls] = useState([]);

  // Find controls once
  useEffect(() => {
    const ctrls = Array.from(document.querySelectorAll(`.${classes.control}`));
    setControls(ctrls);
  }, []);

  const showUI = useCallback(() => {
    if (controls.length > 0) {
      gsap.to(controls, {
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.5,
      });
    }
  }, [controls]);

  const goToSlide = useCallback(
    (index) => {
      if (!texturesRef.current[index]) return;
      isTransitioningRef.current = true;

      const newTexture = texturesRef.current[index];

      // Animate from currentTextures to newTexture
      setCurrentTextures((prev) => [prev[0], newTexture]);

      const progressObj = { value: 0 };
      gsap.to(progressObj, {
        value: 1,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          transitionProgressRef.current = progressObj.value;
        },
        onComplete: () => {
          isTransitioningRef.current = false;
          transitionProgressRef.current = 0;
          currentIndexRef.current = index;

          requestAnimationFrame(() => {
            setCurrentTextures([newTexture, newTexture]);
          });
        },
      });
    },
    [texturesRef]
  );

  const changeSlide = useCallback(
    (direction) => {
      if (isTransitioningRef.current || loading || texturesRef.current.length === 0) return;

      const targetIndex = (currentIndexRef.current + direction + slides.length) % slides.length;
      const oldTexture = currentTextures[1];

      isTransitioningRef.current = true;
      createVideoTexture(slides[targetIndex].video)
        .then((newTexture) => {
          setCurrentTextures((prev) => [prev[0], newTexture]);

          const progressObj = { value: 0 };
          gsap.to(progressObj, {
            value: 1,
            duration: 1.8,
            ease: "power2.inOut",
            onUpdate: () => {
              transitionProgressRef.current = progressObj.value;
            },
            onComplete: () => {
              disposeTexture(oldTexture);
              setCurrentTextures([newTexture, newTexture]);
              currentIndexRef.current = targetIndex;
              transitionProgressRef.current = 0;
              isTransitioningRef.current = false;
            },
          });
        })
        .catch((err) => {
          console.error("Error loading new slide:", err);
          isTransitioningRef.current = false;
        });
    },
    [loading, slides, texturesRef]
  );

  // Trigger the initial slide only once after loading
  useEffect(() => {
    if (!loading && texturesRef.current.length > 0 && currentIndexRef.current === -1) {
      goToSlide(0);
      showUI();
      // Set currentIndexRef so we don't try to do it again
      // But note that goToSlide(0) sets it when complete
    }
  }, [loading, texturesRef, goToSlide, showUI]);

  return (
    <div className={classes.container} ref={containerRef} onClick={() => changeSlide(1)}>
      {loading ? (
        <div className={classes.loader}>Loading... {Math.round(progress)}%</div>
      ) : (
        <Canvas camera={{ position: [0, 0, 2], fov: 100 }}>
          <ShaderPlane transitionProgressRef={transitionProgressRef} currentTextures={currentTextures} />
        </Canvas>
      )}
      <div className={classes.controls} ref={controlsRef}>
        <div className={classes.control} onClick={() => changeSlide(1)}>
          {"<"}
        </div>
        <div className={classes.control} onClick={() => changeSlide(-1)}>
          {">"}
        </div>
      </div>
      <div className={classes.line33} />
      <div className={classes.line66} />
    </div>
  );
}
