"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial, useAspect } from "@react-three/drei";
import { fragmentShader, vertexShader } from "./shaders";
import classes from "./Hero.module.css";
import slides from "./data";
import Loader from "./Loader/Loader";
import CanvasWrapper from "./CanvasWrapper/CanvasWrapper";
import { useHero } from "@/context/hero-context";
import Titles from "./Titles/Titles";
import HeroFooter from "./HeroFooter/HeroFooter";

const Hero = () => {
  const { loading } = useHero();
  return (
    <div className={classes.container}>
      <Loader />
      <Titles />
      <CanvasWrapper />
      <HeroFooter />

      {/*  <div className={classes.content} ref={textContainerRef}>
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
          </Canvas> */}

      <div className={classes.line33} />
      <div className={classes.line66} />
    </div>
  );
};

export default Hero;
