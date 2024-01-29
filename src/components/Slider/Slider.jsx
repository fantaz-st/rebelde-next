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

const Mesh = () => {
  const viewport = useThree((state) => state.viewport);
  const size = useAspect(viewport.width, viewport.height);

  const ctx = useContext(SliderContext);

  const { headerRef, captionRef, footerRef, transitionRef, indexRef, materialRef, slideIndexRef, isTransitioningRef } = ctx;

  const textures = [useVideoTexture(slides[0].src), useVideoTexture(slides[1].src), useVideoTexture(slides[2].src)];

  const transparentPixelTexture = useLoader(TextureLoader, transparentPixelSrc.src);

  const transition = (first = "lol") => {
    if (!materialRef.current) return;
    if (isTransitioningRef.current) return;

    isTransitioningRef.current = true;

    const currentSlideIndex = slideIndexRef.current;
    const nextSlideIndex = (currentSlideIndex + 1) % slides.length;

    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onStart: () => {
          if (first === "first") {
            gsap.to(headerRef.current, {
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
          }
        },
        onUpdate: () => {
          materialRef.current.uniforms.uTransitionProgress.value = tl.progress();
        },
        onComplete: () => {
          materialRef.current.uniforms.uTransitionProgress.value = 0;
          materialRef.current.uniforms.uTexture1.value = textures[currentSlideIndex];
          materialRef.current.uniforms.uTexture2.value = textures[nextSlideIndex];
          isTransitioningRef.current = false;
          slideIndexRef.current = nextSlideIndex;
        },
      });

      const changeText = () => {
        const words = slides[slideIndexRef.current].caption.split(" ");
        const html = words.map((word, i) => `<span key=${i}>${word}</span>`).join(" ");
        captionRef.current.innerHTML = html;
        gsap.from(captionRef.current.children, { y: "100%", rotationZ: "10", opacity: 0, stagger: 0.1, ease: "power2.out" });
      };

      tl.to(materialRef.current.uniforms.uTransitionProgress, {
        value: 1,
        duration: 0.8,
        ease: "power2.out",
      })

        .to(captionRef.current.children, {
          delay: -1,
          opacity: 0,
          ease: "power2.out",
          onComplete: changeText,
        })
        .to(indexRef.current, {
          y: "-100%",
          ease: "power2.out",
          onComplete: () => {
            indexRef.current.textContent = `0${slideIndexRef.current + 1}`;
          },
        });
    }, materialRef);

    return () => ctx.revert();
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
