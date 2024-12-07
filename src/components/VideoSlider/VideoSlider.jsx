import React, { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial, useAspect } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import classes from "./VideoSlider.module.css";
import slides from "./data";
import { fragmentShader, vertexShader } from "./shaders";

gsap.registerPlugin(useGSAP);

// Define the shader material outside of the component
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

// A helper function to create a video texture
function createVideoTexture(src, onProgress) {
  const video = document.createElement("video");
  video.src = src;
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;

  return new Promise((resolve, reject) => {
    video.onprogress = () => {
      const buffered = video.buffered;
      if (buffered.length) {
        const percent = (buffered.end(0) / video.duration) * 100;
        onProgress(percent);
      }
    };

    video.oncanplay = () => {
      video
        .play()
        .then(() => {
          const texture = new THREE.VideoTexture(video);
          resolve(texture);
        })
        .catch((error) => reject(error));
    };

    video.onerror = () => reject(new Error(`Failed to load video: ${src}`));
  });
}

// A helper function to dispose of old textures
function disposeTexture(texture) {
  if (texture instanceof THREE.VideoTexture && texture.image) {
    // Pause and clear the video source to help with garbage collection
    texture.image.pause();
    texture.image.src = "";
    texture.dispose();
  }
}

// Custom hook to handle loading of video textures
function useVideoTextures(slides) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const texturesRef = useRef([]);

  useEffect(() => {
    let isMounted = true;

    const handleProgress = (percent) => {
      setProgress((prev) => Math.min(100, prev + percent / slides.length));
    };

    // Load all slides as textures
    Promise.all(slides.map((slide) => createVideoTexture(slide.video, handleProgress)))
      .then((textures) => {
        if (isMounted) {
          // Initially set only the first two textures (same texture twice initially)
          texturesRef.current = textures.slice(0, 2);
          setLoading(false);
        }
      })
      .catch((error) => console.error("Error loading video textures:", error));

    return () => {
      isMounted = false;
    };
  }, [slides]);

  return { texturesRef, loading, progress };
}

function ShaderPlane({ texturesRef, progressRef }) {
  const materialRef = useRef();
  const { viewport } = useThree();
  const scale = useAspect(viewport.width, viewport.height, 1);

  // Set static uniforms once
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uOffsetAmount = 3;
      materialRef.current.uColumnsCount = 3.0;
      materialRef.current.uAngle = (45 * Math.PI) / 180;
      materialRef.current.uScale = 3;
      materialRef.current.uInputResolution = new THREE.Vector2(16, 9);
    }
  }, []);

  // Update dynamic uniforms each frame
  useFrame(() => {
    if (materialRef.current && texturesRef.current) {
      materialRef.current.uTexture1 = texturesRef.current[0];
      materialRef.current.uTexture2 = texturesRef.current[1];
      materialRef.current.uTransitionProgress = progressRef.current;
      // Output resolution based on current scale
      materialRef.current.uOutputResolution = new THREE.Vector2(scale[0], scale[1]);
    }
  });

  return (
    <mesh scale={scale}>
      <planeGeometry args={[1, 1]} />
      <complexShaderMaterial ref={materialRef} />
    </mesh>
  );
}

const VideoSlider = () => {
  const containerRef = useRef(null);
  const scrollTimeout = useRef(0);
  const isTransitioningRef = useRef(false);
  const currentIndexRef = useRef(0);
  const progressRef = useRef(0);

  const { texturesRef, loading, progress } = useVideoTextures(slides);

  // Function to change slides
  const changeSlide = useCallback(
    (direction) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      const targetIndex = (currentIndexRef.current + direction + slides.length) % slides.length;

      createVideoTexture(slides[targetIndex].video, () => {})
        .then((nextVideoTexture) => {
          const oldTexture = texturesRef.current[1];
          texturesRef.current[1] = nextVideoTexture;

          gsap.to(progressRef, {
            current: 1.0,
            duration: 1,
            ease: "power2.out",
            onUpdate: () => {
              progressRef.current = gsap.getProperty(progressRef, "current");
            },
            onComplete: () => {
              disposeTexture(oldTexture);
              texturesRef.current = [nextVideoTexture, nextVideoTexture];
              currentIndexRef.current = targetIndex;
              progressRef.current = 0.0;
              isTransitioningRef.current = false;
            },
          });
        })
        .catch(console.error);
    },
    [texturesRef]
  );

  const handleWheel = useCallback(
    (event) => {
      if (!isTransitioningRef.current) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          changeSlide(event.deltaY > 0 ? 1 : -1);
        }, 300);
      }
    },
    [changeSlide]
  );

  return (
    <div className={classes.container} ref={containerRef} onWheel={handleWheel}>
      {loading ? (
        <div className={classes.loader}>Loading... {Math.round(progress)}%</div>
      ) : (
        <Canvas camera={{ position: [0, 0, 2], fov: 100 }}>
          <ShaderPlane texturesRef={texturesRef} progressRef={progressRef} />
        </Canvas>
      )}
    </div>
  );
};

export default VideoSlider;
