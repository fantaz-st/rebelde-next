import classes from "./VideoSlider.module.css";

import slides from "@/helpers/slides";
import { verticalLoop } from "@/helpers/verticalLoop";
import { vertexShader, fragmentShader } from "./shaders";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { TextureLoader } from "three";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { useAspect, useVideoTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useContext, useRef } from "react";

import transparentPixelSrc from "../../assets/transparent-pixel.png";
import suspenseImg from "../../assets/suspense.png";

const VideoSlider = () => {
  const containerRef = useRef(null);
  return (
    <div className={classes.container} ref={containerRef}>
      <div className={classes.overlay} />

      <div className={classes.slideContent}>
        <div className={classes.textContainer}>
          <div className={classes.inner}>
            {slides.map((slide, index) => (
              <div key={slide.id} className={classes.title}>
                <h1 className={classes.caption}>{slide.caption}</h1>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSlider;
