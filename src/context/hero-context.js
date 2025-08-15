"use client";

import React, { createContext, useContext, useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import slides from "@/components/Hero/data";
import { fragmentShader, vertexShader } from "@/components/Hero/shaders";

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

const Ctx = createContext(null);
export const useHero = () => useContext(Ctx);

const W = {
  V0_META: 0.15,
  V0_CANPLAY: 0.35,
  V0_BUFFER: 0.25,
  V1_BUFFER: 0.25,
};

const makeTransparentTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

const createVideo = (src) => {
  const v = document.createElement("video");
  v.src = src;
  v.preload = "auto";
  v.crossOrigin = "anonymous";
  v.loop = true;
  v.muted = true;
  v.playsInline = true;
  return v;
};

const waitLoadedMetadata = (video) =>
  new Promise((res, rej) => {
    const onLoaded = () => {
      cleanup();
      res();
    };
    const onErr = () => {
      cleanup();
      rej(new Error("video error (metadata)"));
    };
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onErr);
    };
    if (!isNaN(video.duration) && video.readyState >= 1) return res();
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onErr);
  });

const waitCanPlay = (video) =>
  new Promise((res, rej) => {
    const onReady = () => {
      cleanup();
      res();
    };
    const onErr = () => {
      cleanup();
      rej(new Error("video error (canplay)"));
    };
    const cleanup = () => {
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onErr);
    };
    if (video.readyState >= 2) return res();
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onErr);
  });

const waitBufferedSeconds = (video, minSeconds) =>
  new Promise((res) => {
    let rafId = 0;
    const tick = () => {
      try {
        const end = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
        const need = Math.min(minSeconds, isFinite(video.duration) ? video.duration : minSeconds);
        if (end >= need) {
          cancelAnimationFrame(rafId);
          res();
          return;
        }
      } catch {}
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  });

export const HeroProvider = ({ children }) => {
  const texturesRef = useRef([new THREE.Texture(), new THREE.Texture()]);
  const progressRef = useRef(0);
  const indexRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const textContainerRef = useRef(null);
  const footerRef = useRef(null);
  const headerRef = useRef(null);
  const counterRef = useRef(null);

  const [counter, setCounter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [displayProgress, setDisplayProgress] = useState(0);
  const realProgressRef = useRef(0);
  const cache = useRef(new Map());
  const [activeMenu, setActiveMenu] = useState(false);
  const transitionIdRef = useRef(0);

  const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);
  const addProgress = (delta) => {
    realProgressRef.current = Math.max(0, Math.min(1, realProgressRef.current + delta));
  };
  const validCached = (t) => t instanceof THREE.VideoTexture && t.image;

  useEffect(() => {
    let r = 0;
    let raf = 0;
    const tick = () => {
      r = gsap.utils.interpolate(r, realProgressRef.current, 0.15);
      setDisplayProgress(Math.round(r * 100));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const animateCounterTo = (n) => {
    const el = counterRef.current;
    if (!el) return setCounter(n);
    gsap.to(el, {
      y: -20,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => {
        setCounter(n);
        gsap.fromTo(el, { y: 20 }, { y: 0, duration: 0.24, ease: "power2.out" });
      },
    });
  };

  const captionsOut = (i) => {
    const list = textContainerRef.current?.querySelectorAll(".title");
    const node = list?.[i];
    if (!node) return gsap.timeline();
    const spans = node.querySelectorAll("p span");
    return gsap.fromTo(
      spans,
      { yPercent: 0 },
      {
        yPercent: -100,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out",
        onComplete: () => node.classList.remove("active"),
      }
    );
  };

  const captionsIn = (i, delay = 0) => {
    const list = textContainerRef.current?.querySelectorAll(".title");
    const node = list?.[i];
    if (!node) return gsap.timeline();
    node.classList.add("active");
    const spans = node.querySelectorAll("p span");
    gsap.killTweensOf(spans);
    return gsap.fromTo(spans, { yPercent: 100 }, { yPercent: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", delay });
  };

  const ensureTexture = async (i) => {
    const c = cache.current.get(i);
    if (c && validCached(c)) return c;
    if (c) cache.current.delete(i);
    // staged preload for i === 0 in init; here we do the "ready to play + X sec" path
    const video = createVideo(slides[i].video);
    await waitLoadedMetadata(video); // metadata before anything else
    await video.play().catch(() => {}); // warm decoder
    await waitBufferedSeconds(video, 2); // generic min buffer
    const tex = new THREE.VideoTexture(video);
    cache.current.set(i, tex);
    return tex;
  };

  const showUI = () => {
    if (headerRef.current) gsap.to(headerRef.current, { y: 0, duration: 0.5, ease: "power2.out", delay: 0.4 });
    if (footerRef.current) gsap.to(footerRef.current, { y: 0, duration: 0.5, ease: "power2.out", delay: 0.4 });
  };

  const masterTransition = async (targetIndex) => {
    if (isTransitioningRef.current) return;

    const total = slides.length;
    const nextIndex = ((targetIndex % total) + total) % total;
    const prevIndex = indexRef.current;
    const myId = ++transitionIdRef.current;

    try {
      const texNext = await ensureTexture(nextIndex);
      if (transitionIdRef.current !== myId || !validCached(texNext)) return;

      isTransitioningRef.current = true;

      const oldTo = texturesRef.current[1];
      texturesRef.current[1] = texNext;

      const tl = gsap.timeline({
        onComplete: () => {
          // keep texNext; dispose oldTo only if not used
          if (oldTo && oldTo !== texturesRef.current[0] && oldTo !== texNext) {
            const entry = [...cache.current.entries()].find(([, v]) => v === oldTo);
            if (entry) cache.current.delete(entry[0]);
            if (oldTo instanceof THREE.VideoTexture && oldTo.image) oldTo.dispose();
          }
          texturesRef.current = [texNext, texNext];
          indexRef.current = nextIndex;
          progressRef.current = 0;
          isTransitioningRef.current = false;
        },
      });

      tl.add(captionsOut(prevIndex), 0);
      tl.fromTo(progressRef, { current: 0 }, { current: 1, duration: 1, ease: "power3.inOut" }, 0.05);
      tl.add(() => animateCounterTo(nextIndex + 1), 0.1);
      tl.add(captionsIn(nextIndex), 0.55);
    } catch {
    } finally {
      if (transitionIdRef.current === myId) isTransitioningRef.current = false;
    }

    const preloadNext = (nextIndex + 1) % total;
    if (!cache.current.has(preloadNext)) ensureTexture(preloadNext);
  };

  const goToSlide = async (i) => masterTransition(i);
  const goToNextSlide = () => {
    if (loading || isTransitioningRef.current) return;
    masterTransition(indexRef.current + 1);
  };
  const goToPreviousSlide = () => {
    if (loading || isTransitioningRef.current) return;
    masterTransition(indexRef.current - 1);
  };

  // Deterministic preload + true 0→100 progress, then zero transition (no overlayed %)
  useEffect(() => {
    let mounted = true;
    (async () => {
      realProgressRef.current = 0;

      // ── Video 0 staged milestones
      const v0 = createVideo(slides[0].video);

      try {
        await waitLoadedMetadata(v0);
        if (!mounted) return;
        addProgress(W.V0_META);

        await waitCanPlay(v0);
        if (!mounted) return;
        addProgress(W.V0_CANPLAY);

        // buffer 3s for v0, in parallel start v1 milestone
        const v1 = createVideo(slides[1 % slides.length].video);
        const v1Ready = (async () => {
          await waitLoadedMetadata(v1).catch(() => {});
          await v1.play().catch(() => {});
          await waitBufferedSeconds(v1, 2);
          if (mounted) addProgress(W.V1_BUFFER);
          // prepare tex and cache
          const t1 = new THREE.VideoTexture(v1);
          cache.current.set(1 % slides.length, t1);
        })();

        await v0.play().catch(() => {});
        await waitBufferedSeconds(v0, 3);
        if (!mounted) return;
        addProgress(W.V0_BUFFER);

        // ── Create tex0 now
        const tex0 = new THREE.VideoTexture(v0);

        // Wait for v1 milestone (if not done)
        await v1Ready;

        // At this point realProgressRef == 1.0 → hide loader
        setLoading(false);

        // Prepare placeholder → first video
        const placeholder = makeTransparentTexture();
        texturesRef.current = [placeholder, tex0];
        indexRef.current = 0;
        setCounter(1);

        // Start zero shader blend (no loader visible now)
        const zero = { v: 0 };
        gsap.to(zero, {
          v: 1,
          duration: 1,
          ease: "power2.out",
          onUpdate: () => (progressRef.current = zero.v),
          onComplete: () => {
            progressRef.current = 0;
            texturesRef.current = [tex0, tex0];
            captionsIn(0, 0);
            showUI();
          },
        });

        // Preload slide 2 in background if exists and not cached
        const preloadNext = 2 % slides.length;
        if (!cache.current.has(preloadNext)) ensureTexture(preloadNext);
      } catch {
        // If anything fails, still fail-safe to showing first slide once playable
        try {
          await v0.play();
          const tex0 = new THREE.VideoTexture(v0);
          setLoading(false);
          const placeholder = makeTransparentTexture();
          texturesRef.current = [placeholder, tex0];
          indexRef.current = 0;
          const zero = { v: 0 };
          gsap.to(zero, {
            v: 1,
            duration: 1,
            ease: "power2.out",
            onUpdate: () => (progressRef.current = zero.v),
            onComplete: () => {
              progressRef.current = 0;
              texturesRef.current = [tex0, tex0];
              captionsIn(0, 0);
              showUI();
            },
          });
        } catch {}
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      loading,
      progress: displayProgress, // smoothed %
      texturesRef,
      progressRef,
      textContainerRef,
      footerRef,
      headerRef,
      counterRef,
      counter,
      goToNextSlide,
      goToPreviousSlide,
      goToSlide,
      isTransitioning: isTransitioningRef,
      activeMenu,
      setActiveMenu,
      toggleActiveMenu: () => setActiveMenu((v) => !v),
      fmt,
    }),
    [loading, displayProgress, counter, activeMenu]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
