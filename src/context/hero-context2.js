"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";
import * as THREE from "three";
import slides from "@/components/Hero2/data";

export const VideoSliderContext = createContext();

// export const useVideoSlider = () => useContext(VideoSliderContext);

export const VideoSliderProvider = ({ children }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [counter, setCounter] = useState(1); // Counter for current slide

  // Refs
  const currentIndexRef = useRef(0);
  const texturesRef = useRef([]);
  const progressRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const placeholderTextureRef = useRef(null);
  const currentSlideIndex = useRef(0);

  // Utility: Dispose old textures
  const disposeOldTexture = useCallback((oldTexture) => {
    if (oldTexture instanceof THREE.VideoTexture && oldTexture.image) {
      oldTexture.image.pause();
      oldTexture.image.src = "";
      oldTexture.dispose();
    }
  }, []);

  // Utility: Create video texture
  const createVideoTexture = useCallback((src, onProgress) => {
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
  }, []);

  // Define updateCounter before goToSlide
  const updateCounter = useCallback((num) => {
    const counterElement = document.querySelector(".counter span"); // Update the counter in Footer
    if (!counterElement) return;

    // Animate counter out and in
    gsap.fromTo(
      counterElement,
      { y: 0 },
      {
        y: -20,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setCounter(num);
          gsap.fromTo(
            counterElement,
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
  }, []);

  // Define goToSlide after updateCounter
  const goToSlide = useCallback(
    (index) => {
      if (isTransitioningRef.current) return;

      isTransitioningRef.current = true; // Set transitioning state
      const prevIndex = currentSlideIndex.current;
      currentSlideIndex.current = index;

      animateCaptions(prevIndex, index, () => {
        isTransitioning.current = false; // Reset transitioning state
      });

      updateCounter(index + 1);
    },
    [updateCounter]
  );

  // Define goToNextSlide and goToPreviousSlide after goToSlide
  const goToNextSlide = useCallback(() => {
    const nextIndex = (currentSlideIndex.current + 1) % slides.length;
    goToSlide(nextIndex);
  }, [goToSlide]);

  const goToPreviousSlide = useCallback(() => {
    const prevIndex = (currentSlideIndex.current - 1 + slides.length) % slides.length;
    goToSlide(prevIndex);
  }, [goToSlide]);

  const animateCaptions = useCallback((prev, next, onComplete) => {
    if (prev === next) {
      onComplete?.();
      return;
    }
    animateOutPreviousCaptions(prev, () => {
      animateInNextCaption(next, onComplete);
    });
  }, []);

  const animateOutPreviousCaptions = useCallback((prev, callback) => {
    const captions = document.querySelectorAll(".textContainer .title");
    const caption = captions[prev];
    if (!caption) {
      callback?.();
      return;
    }

    const spans = caption.querySelectorAll("span");
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
  }, []);

  const animateInNextCaption = useCallback((next, callback) => {
    const captions = document.querySelectorAll(".textContainer .title");
    const caption = captions[next];
    if (!caption) return;

    const spans = caption.querySelectorAll("span");
    console.log(spans + "lol");
    gsap.fromTo(
      spans,
      { yPercent: 100 },
      {
        yPercent: 0,
        stagger: 0.05,
        duration: 0.5,
        ease: "power2.out",
        onComplete: callback,
      }
    );
  }, []);

  // Load initial textures
  const loadInitialTextures = useCallback(
    (showUI) => {
      const img = new Image();
      img.src = "/transparent-pixel.png";
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;
        placeholderTextureRef.current = tex;
        texturesRef.current = [tex, tex];
      };

      const handleProgress = (percent) => {
        setProgress((prev) => Math.min(100, prev + percent / slides.length));
      };

      Promise.all(slides.slice(0, 2).map((slide) => createVideoTexture(slide.video, handleProgress)))
        .then((textures) => {
          const firstVideo = textures[0];
          texturesRef.current = [placeholderTextureRef.current, firstVideo];
          setLoading(false);

          const progressObj = { value: 0 };
          gsap.to(progressObj, {
            value: 1,
            duration: 1,
            ease: "power2.out",
            onUpdate: () => {
              progressRef.current = progressObj.value;
            },
            onComplete: () => {
              disposeOldTexture(placeholderTextureRef.current);
              texturesRef.current = [firstVideo, firstVideo];
              progressRef.current = 0;
              currentIndexRef.current = 0;
              showUI();
            },
          });
        })
        .catch((error) => console.error("Error loading video textures:", error));
    },
    [createVideoTexture, disposeOldTexture]
  );

  // Slide transition logic
  const changeSlide = useCallback(
    (direction) => {
      if (isTransitioningRef.current || loading || texturesRef.current.length === 0) return;
      isTransitioningRef.current = true;

      const targetIndex = (currentIndexRef.current + direction + slides.length) % slides.length;
      createVideoTexture(slides[targetIndex].video, () => {}).then((nextVideoTexture) => {
        const oldTexture = texturesRef.current[1];
        texturesRef.current[1] = nextVideoTexture;
        if (direction === 1 ? goToNextSlide() : goToPreviousSlide())
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
    [loading, createVideoTexture, disposeOldTexture]
  );

  useEffect(() => {
    const showUI = () => {
      gsap.to(".footer", {
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.5,
      });
    };
    loadInitialTextures(showUI);
  }, [loadInitialTextures]);

  return (
    <VideoSliderContext.Provider
      value={{
        loading,
        progress,
        currentIndexRef,
        texturesRef,
        progressRef,
        isTransitioningRef,
        counter,
        changeSlide,
        loadInitialTextures,
        animateInNextCaption,
      }}
    >
      {children}
    </VideoSliderContext.Provider>
  );
};

/*   useGSAP(() => {
     if (loading) return;

    const handleWheel = (event) => {
      if (isTransitioningRef.current) return;
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        changeSlide(event.deltaY > 0 ? 1 : -1);
      }, 300);
    };

    containerRef.current.addEventListener("wheel", handleWheel);
  }, [loading, containerRef, changeSlide]); */
