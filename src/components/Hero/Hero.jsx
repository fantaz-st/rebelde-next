"use client";

import classes from "./Hero.module.css";
import Loader from "./Loader/Loader";
import CanvasWrapper from "./CanvasWrapper/CanvasWrapper";
import Titles from "./Titles/Titles";
import HeroFooter from "./HeroFooter/HeroFooter";

const Hero = () => {
  return (
    <div className={classes.container}>
      <Loader />
      <Titles />
      <CanvasWrapper />
      <HeroFooter />
      <div className={classes.line33} />
      <div className={classes.line66} />
    </div>
  );
};

export default Hero;
