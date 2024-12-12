"use client";

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

const VideoSlider = () => {
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
  const textContainerRef = useRef(null);

  const showUI = useCallback(() => {
    // Footer animation
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
        }
      })
      .catch((error) => console.error("Error loading video textures:", error));

    return () => {
      isMounted = false;
    };
  }, [showUI]);

  useGSAP(() => {
    if (loading) return;

    const handleWheel = (event) => {
      if (isTransitioningRef.current) return;
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        changeSlide(event.deltaY > 0 ? 1 : -1);
      }, 300);
    };

    containerRef.current.addEventListener("wheel", handleWheel);
  }, [loading, containerRef, changeSlide]);

  return (
    <div className={classes.container} ref={containerRef}>
      {loading ? (
        <div className={classes.loader}>Loading... {Math.round(progress)}%</div>
      ) : (
        <>
          <Canvas camera={{ position: [0, 0, 2], fov: 100 }}>
            <ShaderPlane texturesRef={texturesRef} progressRef={progressRef} />
          </Canvas>
          <div className={classes.textContainer} ref={textContainerRef}>
            {slides.map((slide, i) => (
              <div key={slide.id} className={classes.title}>
                {slide.title.map((titl, j) => (
                  <p key={slide.id + j}>
                    <span>{titl}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className={classes.footer} ref={footerRef}>
            <div className={classes.controls}>
              <div className={classes.control} onClick={() => changeSlide(-1)}>
                {"<"}
              </div>
              <div className={classes.control} onClick={() => changeSlide(1)}>
                {">"}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoSlider;
