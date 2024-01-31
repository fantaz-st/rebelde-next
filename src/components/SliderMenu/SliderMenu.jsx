import Image from "next/image";
import slides from "@/helpers/slides";
import classes from "./SliderMenu.module.css";
import { useContext } from "react";
import { SliderContext } from "@/context/slider-context";

const SliderMenu = () => {
  const ctx = useContext(SliderContext);
  const { activeMenu, toggleActiveMenu, footerRef, indexRef, closeButtonRef, prevSlide, nextSlide } = ctx;

  return (
    <>
      <div className={classes.container}>
        <svg className={activeMenu ? `${classes.active} ${classes.ham} ${classes.ham6}` : `${classes.ham} ${classes.ham6}`} viewBox='0 0 100 100' width='80' onClick={toggleActiveMenu} ref={closeButtonRef}>
          <path className={`${classes.line} ${classes.top}`} d='m 30,33 h 40 c 13.100415,0 14.380204,31.80258 6.899646,33.421777 -24.612039,5.327373 9.016154,-52.337577 -12.75751,-30.563913 l -28.284272,28.284272' />
          <path className={`${classes.line} ${classes.middle}`} d='m 70,50 c 0,0 -32.213436,0 -40,0 -7.786564,0 -6.428571,-4.640244 -6.428571,-8.571429 0,-5.895471 6.073743,-11.783399 12.286435,-5.570707 6.212692,6.212692 28.284272,28.284272 28.284272,28.284272' />
          <path className={`${classes.line} ${classes.bottom}`} d='m 69.575405,67.073826 h -40 c -13.100415,0 -14.380204,-31.80258 -6.899646,-33.421777 24.612039,-5.327373 -9.016154,52.337577 12.75751,30.563913 l 28.284272,-28.284272' />
        </svg>

        <div className={classes.slideFooter} ref={footerRef}>
          <div className={classes.controls}>
            <div className={classes.slideIndex}>
              <p>
                <span ref={indexRef} className={classes.index}>
                  01
                </span>
                <span className={classes.separator}>|</span> 0{slides.length}
              </p>
            </div>
            <div className={classes.buttons}>
              <div className={classes.previous} onClick={prevSlide}></div>
              <div className={classes.next} onClick={nextSlide}></div>
            </div>
          </div>
        </div>

        <div className={activeMenu ? `${classes.menu} ${classes.active}` : classes.menu}>
          {slides.map((item, i) => (
            <div className={classes.menu_item} key={i}>
              <h2>{item.caption}</h2>
              <Image src={item.poster} alt={item.caption} fill style={{ objectFit: "cover" }} sizes='(min-width: 660px) 33.33vw, 100vw' />
            </div>
          ))}
        </div>
      </div>
      <div className={activeMenu ? `${classes.menu_overlay} ${classes.active}` : classes.menu_overlay} onClick={toggleActiveMenu} />
    </>
  );
};

export default SliderMenu;
