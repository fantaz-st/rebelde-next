import { useHero } from "@/context/hero-context";
import classes from "./HeroFooter.module.css";
import slides from "../data";

const HeroFooter = () => {
  const { footerRef, counterRef, goToPreviousSlide, goToNextSlide, counter } = useHero();

  return (
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
  );
};

export default HeroFooter;
