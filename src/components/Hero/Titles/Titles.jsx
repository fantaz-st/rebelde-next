import { useHero } from "@/context/hero-context";
import classes from "./Titles.module.css";
import slides from "../data";

const Titles = () => {
  const { textContainerRef } = useHero();
  return (
    <div className={classes.content} ref={textContainerRef}>
      {slides.map((slide, i) => (
        <div key={slide.id} className={`${classes.title} title`}>
          {slide.title.map((titl, j) => (
            <p key={slide.id + j}>
              <span>{titl}</span>
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Titles;
