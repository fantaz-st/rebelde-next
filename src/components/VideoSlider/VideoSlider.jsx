import React, { useRef, useEffect, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { verticalLoop } from "@/helpers/verticalLoop";
import classes from "./VideoSlider.module.css";
import slides from "./data";
import { fragmentShader, vertexShader } from "./shaders";
import { CustomEase } from "gsap/all";
import { Vector2 } from "three";

gsap.registerPlugin(useGSAP, CustomEase);

CustomEase.create("hop", "M0,0 C0.29,0 0.348,0.05 0.422,0.134 0.494,0.217 0.484,0.355 0.5,0.5 0.518,0.662 0.515,0.793 0.596,0.876 0.701,0.983 0.72,0.987 1,1");

const ComplexShaderMaterial = shaderMaterial(
  {
    uTexture1: new THREE.Texture(),
    uTexture2: new THREE.Texture(),
    uOffsetAmount: 3,
    uColumnsCount: 3.0,
    uTransitionProgress: 0.0,
    uAngle: (45 * Math.PI) / 180,
    uScale: 3,
    uInputResolution: new Vector2(1920, 1080),
    uOutputResolution: new Vector2(1, 1),
  },
  vertexShader,
  fragmentShader
);
extend({ ComplexShaderMaterial });

const ShaderPlane = ({ texturesRef, progressRef }) => {
  const materialRef = useRef();
  const { viewport, size } = useThree();

  useEffect(() => {
    // Set uOutputResolution with the actual window dimensions when in the browser
    if (materialRef.current) {
      materialRef.current.uOutputResolution = new Vector2(size.width, size.height);
    }
  }, [size.width, size.height]);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uTexture1 = texturesRef.current[0];
      materialRef.current.uTexture2 = texturesRef.current[1];
      materialRef.current.uTransitionProgress = progressRef.current;
      materialRef.current.uOffsetAmount = 3;
      materialRef.current.uColumnsCount = 3.0;
      materialRef.current.uAngle = (45 * Math.PI) / 180;
      materialRef.current.uScale = 3;
      materialRef.current.uInputResolution = new Vector2(1920, 1080);
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <complexShaderMaterial ref={materialRef} />
    </mesh>
  );
};

const VideoSlider = () => {
  const containerRef = useRef(null);
  const titleLoopRef = useRef(null);
  const scrollTimeout = useRef(0);
  const isTransitioningRef = useRef(false);

  const texturesRef = useRef([]);
  const progressRef = useRef(0);
  const currentIndexRef = useRef(0);
  const directionRef = useRef(1);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const createVideoTexture = (src, onProgress) => {
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    return new Promise((resolve, reject) => {
      const updateProgress = () => {
        const buffered = video.buffered;
        if (buffered.length) {
          const loaded = buffered.end(0);
          const total = video.duration;
          const percent = (loaded / total) * 100;
          onProgress(percent);
        }
      };

      video.onprogress = updateProgress;
      video.oncanplay = () => {
        video
          .play()
          .then(() => resolve(new THREE.VideoTexture(video)))
          .catch((error) => reject(error));
      };

      video.onerror = () => {
        reject(new Error(`Failed to load video: ${src}`));
      };
    });
  };

  const disposeOldTexture = (oldTexture) => {
    if (oldTexture instanceof THREE.VideoTexture && oldTexture.image) {
      const videoElement = oldTexture.image;
      if (!videoElement.paused) videoElement.pause();
      videoElement.src = "";
      oldTexture.dispose();
    }
  };

  useEffect(() => {
    let isMounted = true;
    let totalProgress = 0;

    const handleProgress = (percent) => {
      totalProgress += percent / slides.length;
      setProgress(totalProgress);
      console.log(`Loading progress: ${totalProgress.toFixed(2)}%`);
    };

    Promise.all([createVideoTexture(slides[0].video, handleProgress), createVideoTexture(slides[1].video, handleProgress)])
      .then((videoTextures) => {
        if (isMounted) {
          texturesRef.current = videoTextures;
          setLoading(false);
          setProgress(100); // Set to 100% when all videos are loaded
          console.log("All videos loaded.");
        }
      })
      .catch((error) => {
        console.error("Error loading video textures:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useGSAP(() => {
    if (loading) return;
    const titleItems = gsap.utils.toArray(`.${classes.title}`);
    titleLoopRef.current = verticalLoop(titleItems, { speed: 0.7, repeat: -1, paused: true });

    const changeSlide = (direction) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      directionRef.current = direction;
      const targetIndex = (currentIndexRef.current + direction + slides.length) % slides.length;

      if (direction === 1) {
        titleLoopRef.current.next({ duration: 0.8, ease: "Sine.easeInOut" });
      } else {
        titleLoopRef.current.previous({ duration: 0.8, ease: "Sine.easeInOut" });
      }

      createVideoTexture(slides[targetIndex].video, () => {}).then((nextVideoTexture) => {
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
            disposeOldTexture(oldTexture);
            texturesRef.current = [nextVideoTexture, nextVideoTexture];
            currentIndexRef.current = targetIndex;
            progressRef.current = 0.0;
            isTransitioningRef.current = false;
          },
        });
      });
    };

    const handleWheel = (event) => {
      if (isTransitioningRef.current) return;

      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        changeSlide(event.deltaY > 0 ? 1 : -1);
      }, 300);
    };

    containerRef.current.addEventListener("wheel", handleWheel);
  }, [loading, containerRef]);

  return (
    <div className={classes.container} ref={containerRef}>
      {loading ? (
        <div className={classes.loader}>Loading... {Math.round(progress)}%</div>
      ) : (
        <>
          <div className={classes.slideContent}>
            <div className={classes.textContainer}>
              <div className={classes.inner}>
                {slides.map((slide, index) => (
                  <div key={index} className={classes.title}>
                    <h1>{slide.title}</h1>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Canvas camera={{ position: [0, 0, 2], fov: 100 }}>
            <ShaderPlane texturesRef={texturesRef} progressRef={progressRef} />
          </Canvas>
        </>
      )}
    </div>
  );
};

export default VideoSlider;
