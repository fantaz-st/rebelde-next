"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import slides from "@/components/Hero/data";
import { fragmentShader, vertexShader } from "@/components/Hero/shaders";
// Shader Material
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

// Context
const HeroContext = createContext();

export const useHero = () => useContext(HeroContext);

// Provider
export const HeroProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const texturesRef = useRef([]);
  const progressRef = useRef(0);
  const currentIndexRef = useRef(0);
  const currentSlideIndex = useRef(0);
  const isTransitioningRef = useRef(false);
  const isTransitioning = useRef(false);
  const counterRef = useRef(null);
  const [counter, setCounter] = useState(1);
  const placeholderTextureRef = useRef(null);
  const textContainerRef = useRef(null);
  const footerRef = useRef(null);
  const headerRef = useRef(null);
  const closeButtonRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState(false);

  const toggleActiveMenu = () => {
    setActiveMenu((prev) => !prev);
  };

  const showUI = useCallback(() => {
    if (footerRef.current && headerRef.current) {
      gsap.to(headerRef.current, {
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.5,
      });

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
    const captionEls = textContainerRef.current.querySelectorAll(".title");
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
    const captionEls = textContainerRef.current.querySelectorAll(".title");
    const captionEl = captionEls[next];
    if (!captionEl) return;

    const spans = captionEl.querySelectorAll("p span");

    captionEl.classList.add("active");

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
    <HeroContext.Provider
      value={{
        loading,
        setLoading,
        progress,
        setProgress,
        texturesRef,
        progressRef,
        currentIndexRef,
        currentSlideIndex,
        isTransitioning,
        counter,
        setCounter,
        counterRef,
        createVideoTexture,
        textContainerRef,
        footerRef,
        headerRef,
        goToPreviousSlide,
        goToNextSlide,
        toggleActiveMenu,
        setActiveMenu,
        activeMenu,
        goToSlide,
        changeSlide,
      }}
    >
      {children}
    </HeroContext.Provider>
  );
};
