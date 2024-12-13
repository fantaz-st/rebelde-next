import { useHero } from "@/context/hero-context";
import slides from "./data";
import classes from "./Footer.module.css";

const Footer = () => {
  const { counter, counterRef, currentSlideIndex } = useHero();

  return (
    <div className={classes.footer}>
      <div className={classes.counter}>
        <span className={classes.index} ref={counterRef}>
          0{counter}
        </span>
        <span className={classes.total}>0{slides.length}</span>
      </div>
      <div className={classes.controls}>
        <div className={classes.control} onClick={() => {}}>
          <svg viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M14.5 17L10 12.5L14.5 8' stroke='#fff' strokeWidth='1.2' />
          </svg>
        </div>
        <div className={classes.control} onClick={() => {}}>
          <svg viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M10.5 8L15 12.5L10.5 17' stroke='#fff' strokeWidth='1.2' />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Footer;
