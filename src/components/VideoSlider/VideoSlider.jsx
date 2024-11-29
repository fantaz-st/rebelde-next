import React, { useRef, useEffect, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial, useAspect } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { verticalLoop } from "@/helpers/verticalLoop";
import classes from "./VideoSlider.module.css";
import slides from "./data";
import { fragmentShader, vertexShader } from "./shaders";
import { CustomEase } from "gsap/all";
import { Vector2 } from "three";

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
    uInputResolution: new Vector2(1920, 1080),
    uOutputResolution: new Vector2(1, 1),
  },
  vertexShader,
  fragmentShader
);
extend({ ComplexShaderMaterial });

const ShaderPlane = ({ texturesRef, progressRef }) => {
  const materialRef = useRef();
  const { viewport } = useThree();
  const scale = useAspect(viewport.width, viewport.height, 1);

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

  const [currentIndex, setCurrentIndex] = useState(0); // UI state for titles

  const syncUIWithShader = () => {
    setCurrentIndex(currentIndexRef.current);
  };

  const createVideoTexture = (src, onProgress) => {
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
          .then(() => resolve(new THREE.VideoTexture(video)))
          .catch((error) => reject(error));
      };

      video.onerror = () => reject(new Error(`Failed to load video: ${src}`));
    });
  };

  const disposeOldTexture = (oldTexture) => {
    if (oldTexture instanceof THREE.VideoTexture && oldTexture.image) {
      oldTexture.image.pause();
      oldTexture.image.src = "";
      oldTexture.dispose();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const handleProgress = (percent) => {
      setProgress((prev) => Math.min(100, prev + percent / slides.length));
    };

    Promise.all(slides.map((slide) => createVideoTexture(slide.video, handleProgress)))
      .then((textures) => {
        if (isMounted) {
          texturesRef.current = textures.slice(0, 2); // Start with first two textures
          setLoading(false);
        }
      })
      .catch((error) => console.error("Error loading video textures:", error));

    return () => {
      isMounted = false;
    };
  }, []);

  useGSAP(() => {
    if (loading) return;

    const changeSlide = (direction) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      const targetIndex = (currentIndexRef.current + direction + slides.length) % slides.length;

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
          onStart: () => {
            // Call animateTitles
            animateTitles(targetIndex);
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

    const animateTitles = (newIndex) => {
      const titles = gsap.utils.toArray(`.${classes.title} span`);
      /* gsap.from(titles, {
        yPercent: 100,
        stagger: 0.1,
        ease: "power2.out",
        onComplete: () => {
          setCurrentIndex(newIndex);
          gsap.to(titles, {
            yPercent: 0,
            stagger: 0.1,
            ease: "power2.out",
          });
        },
      }); */

      gsap.to(titles, {
        yPercent: -100, // Move up and away
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex(newIndex); // Update current index STATE regardless of refs

          // Slide in the new title
          const newTitleSpans = document.querySelectorAll(`.${classes.title} span`);
          gsap.fromTo(
            newTitleSpans,
            { yPercent: 100 }, // Start below and invisible
            {
              yPercent: 0,
              delay: 0.5,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
            }
          );
        },
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
                <div className={classes.title}>
                  {slides[currentIndex].title.map((title) => (
                    <h1 key={slides[currentIndex].id + title}>
                      <span>{title}</span>
                    </h1>
                  ))}
                </div>
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
