import React, { useRef, useEffect, useContext } from "react";
import { useVideoSlider, VideoSliderContext } from "@/context/hero-context2";
import classes from "./Titles.module.css";
import slides from "../data";
import gsap from "gsap";

const Titles = () => {
  const textContainerRef = useRef(null);

  const ctx = useContext(VideoSliderContext);
  const { goToNextSlide, goToPreviousSlide, isTransitioningRef, animateInNextCaption } = ctx;

  useEffect(() => {
    animateInNextCaption(0, () => {
      isTransitioningRef.current = false; // Allow transitions after the initial animation
    });
  }, []);

  return (
    <div className={classes.container}>
      <div className={`${classes.textContainer} textContainer`} ref={textContainerRef}>
        {slides.map((slide, i) => (
          <div key={slide.id} className={`${classes.title} title`}>
            {slide.title.map((titl, j) => (
              <p key={`${slide.id}-${j}`}>
                <span>{titl}</span>
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Titles;
