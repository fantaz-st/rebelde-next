import gsap from "gsap";
import { SliderContext } from "@/context/slider-context";
import { TextureLoader } from "three";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { useAspect, useVideoTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useContext } from "react";

import transparentPixelSrc from "../../assets/transparent-pixel.png";
import FallbackMaterial from "../FallbackMaterial/FallbackMaterial";
import customVideoShader from "@/helpers/shaders";
import classes from "./Slider.module.css";
import slides from "@/helpers/slides";

import suspenseImg from "../../assets/suspense.png";
import SplitType from "split-type";

const Mesh = () => {
  const viewport = useThree((state) => state.viewport);
  const size = useAspect(viewport.width, viewport.height);

  const ctx = useContext(SliderContext);

  const { headerRef, captionRef, footerRef, transitionRef, indexRef, materialRef, slideIndexRef, isTransitioningRef, closeButtonRef } = ctx;

  const texture1 = useVideoTexture(slides[0].src);
  const texture2 = useVideoTexture(slides[1].src);
  const texture3 = useVideoTexture(slides[2].src);

  const textures = useMemo(() => [texture1, texture2, texture3], [texture1, texture2, texture3]);

  const transparentPixelTexture = useLoader(TextureLoader, transparentPixelSrc.src);

  const transition = (first = "lol") => {
    const { headerRef, captionRef, footerRef, closeButtonRef, materialRef, slideIndexRef, isTransitioningRef } = ctx;

    if (!materialRef.current || isTransitioningRef.current) return;

    isTransitioningRef.current = true;

    const currentSlideIndex = slideIndexRef.current;
    const nextSlideIndex = (currentSlideIndex + 1) % slides.length;

    const tl = gsap.timeline({
      onStart: () => {
        if (first === "first") {
          showInitialElements();
        }
      },
      onUpdate: () => {
        materialRef.current.uniforms.uTransitionProgress.value = tl.progress();
      },
      onComplete: () => {
        completeTransition(nextSlideIndex, currentSlideIndex);
      },
    });

    startSlideTransition(tl, currentSlideIndex, nextSlideIndex);
    return () => tl.kill();
  };

  const showInitialElements = () => {
    gsap.to(headerRef.current, {
      y: "0%",
      duration: 1,
      delay: 1,
      opacity: 1,
      ease: "power2.out",
    });
    gsap.to(closeButtonRef.current, {
      y: "0%",
      duration: 1,
      delay: 1,
      opacity: 1,
      ease: "power2.out",
    });
    gsap.to(footerRef.current, {
      y: "0%",
      opacity: 1,
      duration: 1,
      delay: 1,
      ease: "power2.out",
    });
  };

  const startSlideTransition = (tl, currentSlideIndex, nextSlideIndex) => {
    tl.to(materialRef.current.uniforms.uTransitionProgress, {
      value: 1,
      duration: 0.6,
      ease: "power2.out",
    })
      .to(captionRef.current.children, {
        delay: -1,
        // opacity: 0,
        yPercent: 0,
        ease: "power2.out",
        onComplete: () => changeText(nextSlideIndex),
      })
      .to(indexRef.current, {
        y: "-100%",
        ease: "power2.out",
        onComplete: () => {
          indexRef.current.textContent = `0${nextSlideIndex + 1}`;
        },
      });
  };

  const completeTransition = (nextSlideIndex, currentSlideIndex) => {
    materialRef.current.uniforms.uTransitionProgress.value = 0;
    materialRef.current.uniforms.uTexture1.value = textures[currentSlideIndex];
    materialRef.current.uniforms.uTexture2.value = textures[nextSlideIndex];
    isTransitioningRef.current = false;
    slideIndexRef.current = nextSlideIndex;
  };

  const changeText = (slideIndex) => {
    const captionText = slides[slideIndex].caption;
    captionRef.current.innerHTML = captionText;

    const splitText = new SplitType(captionRef.current, { types: "lines" });

    gsap.from(splitText.lines, {
      yPercent: 100,
      stagger: 0.2,
      ease: "power2.out",
    });
  };

  transitionRef.current = transition;

  useEffect(() => {
    transition("first");
  }, []);

  const uniforms = useMemo(
    () => ({
      uTexture1: { value: transparentPixelTexture },
      uTexture2: { value: textures[0] },
      uOffsetAmount: { value: 2.25 },
      uColumnsCount: { value: 3 },
      uTransitionProgress: { value: 1 },
      uInputResolution: { value: [16, 9] },
      uOutputResolution: { value: size.slice(0, 2) },
      uAngle: { value: (45 * Math.PI) / 180 },
      uScale: { value: 3 },
    }),
    []
  );
  return (
    <mesh scale={size}>
      <planeGeometry />
      <Suspense fallback={<FallbackMaterial url={suspenseImg} />}>
        <shaderMaterial ref={materialRef} attach='material' args={[customVideoShader]} uniforms={uniforms} toneMapped={false} />
      </Suspense>
    </mesh>
  );
};

const Slider = () => {
  const ctx = useContext(SliderContext);
  return (
    <div className={classes.container}>
      <div className={classes.caption}>
        <h1 ref={ctx.captionRef} />
      </div>

      <Canvas style={{ position: "absolute", top: 0, left: 0 }}>
        <Mesh />
      </Canvas>
    </div>
  );
};

export default Slider;
