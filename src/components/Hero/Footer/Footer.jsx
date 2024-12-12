import { useContext } from "react";
import classes from "./Footer.module.css";
import { VideoSliderContext } from "@/context/hero-context";
import slides from "../data";

const Footer = () => {
  const ctx = useContext(VideoSliderContext);

  const { changeSlide, counter } = ctx;
  return (
    <div className={classes.container}>
      <div className={classes.counter}>
        0<span>{counter}</span>|0{slides.length}
      </div>
      <div className={classes.controls}>
        <div className={classes.control} onClick={() => changeSlide(-1)}>
          {"<"}
        </div>
        <div className={classes.control} onClick={() => changeSlide(1)}>
          {">"}
        </div>
      </div>
    </div>
  );
};

export default Footer;
