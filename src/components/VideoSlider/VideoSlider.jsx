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

// Shader material
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

/**
 * Fetches a video via Fetch API and reports download progress.
 * Returns a Blob URL once fully fetched.
 */
async function fetchVideoWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;

    if (total && onProgress) {
      const percent = (loaded / total) * 100;
      onProgress(percent);
    }
  }

  const blob = new Blob(chunks);
  return URL.createObjectURL(blob);
}

/**
 * Creates a VideoTexture from a blob URL.
 * It sets up a video element, waits for canplay, then resolves a VideoTexture.
 */
function createVideoTextureFromBlobURL(blobURL) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = blobURL;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    // Don't autoplay until we know we can play
    video.autoplay = false;

    video.oncanplay = () => {
      // Play the video
      video
        .play()
        .then(() => {
          const texture = new THREE.VideoTexture(video);
          resolve(texture);
        })
        .catch(reject);
    };

    video.onerror = () => reject(new Error(`Failed to load video from blob URL: ${blobURL}`));
  });
}

/**
 * Loads a single video texture with exact progress.
 * Uses fetchVideoWithProgress and createVideoTextureFromBlobURL together.
 */
async function createVideoTexture(url, onProgress) {
  const blobURL = await fetchVideoWithProgress(url, onProgress);
  return createVideoTextureFromBlobURL(blobURL);
}

/**
 * Disposes a video texture properly.
 */
function disposeTexture(texture) {
  if (texture instanceof THREE.VideoTexture && texture.image) {
    texture.image.pause();
    texture.image.src = "";
    texture.dispose();
  }
}

/**
 * Custom hook to load all video textures from slides.
 * Aggregates progress across all videos.
 */
function useVideoTextures(slides) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const texturesRef = useRef([]);

  useEffect(() => {
    let isMounted = true;
    let loadedCount = 0;

    const handlePerVideoProgress = (percent) => {
      // percent here is for a single video download progress (0-100)
      // We can average across all videos or sum them incrementally
      // For simplicity, we will consider loading complete of each video separately
      // and sum up as they finish.
      // Another approach: track each video's progress individually and average them.
    };

    // We'll load each video sequentially for a stable cumulative progress.
    (async () => {
      try {
        let totalVideos = slides.length;
        let cumulativeProgress = 0;

        for (let i = 0; i < totalVideos; i++) {
          await createVideoTexture(slides[i].video, (videoPercent) => {
            // This is per-video percent
            // Convert to overall progress: (i + videoPercent/100) / totalVideos * 100
            let overall = ((i + videoPercent / 100) / totalVideos) * 100;
            if (isMounted) setProgress(overall);
          }).then((texture) => {
            texturesRef.current.push(texture);
          });
        }

        if (isMounted) {
          setLoading(false);
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

function ShaderPlane({ texturesRef, progressRef }) {
  const materialRef = useRef();
  const { viewport } = useThree();
  const scale = useAspect(viewport.width, viewport.height, 1);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uOffsetAmount = 3;
      materialRef.current.uColumnsCount = 3.0;
      materialRef.current.uAngle = (45 * Math.PI) / 180;
      materialRef.current.uScale = 3;
      materialRef.current.uInputResolution = new THREE.Vector2(16, 9);
    }
  }, []);

  useFrame(() => {
    if (materialRef.current && texturesRef.current.length >= 2) {
      materialRef.current.uTexture1 = texturesRef.current[0];
      materialRef.current.uTexture2 = texturesRef.current[1];
      materialRef.current.uTransitionProgress = progressRef.current;
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
      if (!isTransitioningRef.current && !loading) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          changeSlide(event.deltaY > 0 ? 1 : -1);
        }, 300);
      }
    },
    [changeSlide, loading]
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
