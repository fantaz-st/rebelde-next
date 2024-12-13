"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial, useAspect } from "@react-three/drei";
import { fragmentShader, vertexShader } from "./shaders";
import classes from "./Fuck.module.css";
import slides from "./data";

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

const Fuck = () => {
  const textContainerRef = useRef(null);
  const currentSlideIndex = useRef(0);
  const counterRef = useRef(null);
  const [counter, setCounter] = useState(1);
  const isTransitioning = useRef(false);
  const containerRef = useRef(null);
  const scrollTimeout = useRef(0);
  const isTransitioningRef = useRef(false);

  const texturesRef = useRef([]);
  const progressRef = useRef(0);
  const currentIndexRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const placeholderTextureRef = useRef(null);
  const footerRef = useRef(null);

  const showUI = useCallback(() => {
    if (footerRef.current) {
      gsap.to(footerRef.current, {
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.5,
      });
    }
  }, []);

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

  const updateCounter = (num) => {
    const counterEl = counterRef.current;

    // Animate out
    gsap.fromTo(
      counterEl,
      { y: 0 },
      {
        y: -20,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          // Update the counter after animating out
          setCounter(num);

          // Animate in
          gsap.fromTo(
            counterEl,
            { y: 20 },
            {
              y: 0,
              duration: 0.3,
              ease: "power2.out",
            }
          );
        },
      }
    );
  };

  const goToSlide = useCallback((index) => {
    // Prevent triggering a new transition if one is already active
    if (isTransitioning.current) return;

    isTransitioning.current = true; // Set transitioning to true

    const previousSlideIndex = currentSlideIndex.current;
    currentSlideIndex.current = index;

    animateCaptions(previousSlideIndex, currentSlideIndex.current, () => {
      isTransitioning.current = false; // Reset transitioning when animation is complete
    });
    updateCounter(currentSlideIndex.current + 1);
  }, []);

  const goToNextSlide = () => {
    const index = currentSlideIndex.current === slides.length - 1 ? 0 : currentSlideIndex.current + 1;
    goToSlide(index);
    changeSlide(1);
  };

  const goToPreviousSlide = () => {
    const index = currentSlideIndex.current === 0 ? slides.length - 1 : currentSlideIndex.current - 1;
    goToSlide(index);
    changeSlide(-1);
  };

  const animateCaptions = (prev, next, onComplete) => {
    if (prev === next) {
      onComplete?.();
      return;
    }
    animateOutPreviousCaptions(prev, () => {
      animateInNextCaption(next, false, onComplete);
    });
  };

  const animateOutPreviousCaptions = (prev, callback) => {
    const captionEls = textContainerRef.current.querySelectorAll(`.${classes.title}`);
    const captionEl = captionEls[prev];
    if (!captionEl) {
      callback?.();
      return;
    }

    const spans = captionEl.querySelectorAll("p span");

    gsap.fromTo(
      spans,
      { yPercent: 0 },
      {
        yPercent: -100,
        stagger: 0.05,
        duration: 0.5,
        ease: "power2.out",
        onComplete: callback,
      }
    );
  };

  const animateInNextCaption = (next, first = false, onComplete) => {
    const captionEls = textContainerRef.current.querySelectorAll(`.${classes.title}`);
    const captionEl = captionEls[next];
    if (!captionEl) return;

    const spans = captionEl.querySelectorAll("p span");

    captionEl.classList.add(classes.active);

    gsap.killTweensOf(spans);

    gsap.fromTo(
      spans,
      { yPercent: 100 },
      {
        yPercent: 0,
        stagger: 0.1,
        delay: first ? 0.8 : null,
        duration: 0.5,
        ease: "power2.out",
        onComplete,
      }
    );
  };

  const changeSlide = useCallback(
    (direction) => {
      if (isTransitioningRef.current || loading || texturesRef.current.length === 0) return;
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
          onComplete: () => {
            disposeOldTexture(oldTexture);
            texturesRef.current = [nextVideoTexture, nextVideoTexture];
            currentIndexRef.current = targetIndex;
            progressRef.current = 0.0;
            isTransitioningRef.current = false;
          },
        });
      });
    },
    [loading, slides]
  );

  useEffect(() => {
    const img = new Image();
    img.src = "/transparent-pixel.png";
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      placeholderTextureRef.current = tex;
      texturesRef.current = [tex, tex];
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const handleProgress = (percent) => {
      setProgress((prev) => Math.min(100, prev + percent / slides.length));
    };

    Promise.all(slides.slice(0, 2).map((slide) => createVideoTexture(slide.video, handleProgress)))
      .then((textures) => {
        if (isMounted && textures.length > 0) {
          const firstVideo = textures[0];
          texturesRef.current = [placeholderTextureRef.current, firstVideo];
          setLoading(false);

          const progressObj = { value: 0 };
          gsap.to(progressObj, {
            value: 1,
            duration: 1,
            ease: "power2.out",
            onStart: () => {},
            onUpdate: () => {
              progressRef.current = progressObj.value;
            },
            onComplete: () => {
              animateInNextCaption(0, false, () => {
                isTransitioning.current = false; // Allow transitions after the initial animation
              });
              disposeOldTexture(placeholderTextureRef.current);
              texturesRef.current = [firstVideo, firstVideo];
              progressRef.current = 0;
              currentIndexRef.current = 0;
              showUI();
            },
          });
        }
      })
      /*  .then(() => {
        animateInNextCaption(0, true, () => {
          isTransitioning.current = false; // Allow transitions after the initial animation
        });
      }) */
      .catch((error) => console.error("Error loading video textures:", error));

    return () => {
      isMounted = false;
    };
  }, [showUI]);

  return (
    <div className={classes.container}>
      {loading ? (
        <div className={classes.loader}>
          <h2>Loading... {Math.round(progress)}%</h2>
        </div>
      ) : (
        <>
          <div className={classes.content} ref={textContainerRef}>
            {slides.map((slide, i) => (
              <div key={slide.id} className={classes.title}>
                {slide.title.map((titl, j) => (
                  <p key={slide.id + j}>
                    <span>{titl}</span>
                  </p>
                ))}
              </div>
            ))}

            <div className={classes.footer} ref={footerRef}>
              <div className={classes.counter}>
                <span className={classes.index} ref={counterRef}>
                  0{counter}
                </span>
                <span className={classes.total}>0{slides.length}</span>
              </div>
              <div className={classes.controls}>
                <div className={classes.control} onClick={goToPreviousSlide}>
                  <svg viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M14.5 17L10 12.5L14.5 8' stroke='#fff' strokeWidth='1.2' />
                  </svg>
                </div>
                <div className={classes.control} onClick={goToNextSlide}>
                  <svg viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.5 8L15 12.5L10.5 17' stroke='#fff' strokeWidth='1.2' />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <Canvas camera={{ position: [0, 0, 2], fov: 100 }}>
            <ShaderPlane texturesRef={texturesRef} progressRef={progressRef} />
          </Canvas>
        </>
      )}
      <div className={classes.line33} />
      <div className={classes.line66} />
    </div>
  );
};

export default Fuck;
