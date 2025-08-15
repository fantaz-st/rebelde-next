import { useHero } from "@/context/hero-context";
import classes from "./Titles.module.css";
import slides from "../data";

const Titles = () => {
  const { textContainerRef, isTransitioning } = useHero();
  return (
    <div className={classes.content} ref={textContainerRef} aria-busy={isTransitioning.current ? "true" : "false"}>
      {slides.map((slide) => (
        <div key={slide.id} className={`${classes.title} title`}>
          {slide.title.map((line, j) => (
            <p key={slide.id + j}>
              <span>{line}</span>
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Titles;
