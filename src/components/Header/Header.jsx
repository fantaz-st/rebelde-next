import { useContext } from "react";
import { SliderContext } from "@/context/slider-context";
import classes from "./Header.module.css";

const Header = () => {
  const ctx = useContext(SliderContext);
  return (
    <div className={classes.header} ref={ctx.headerRef}>
      <div className={classes.logo}>
        <h2>
          <span>R</span>BD
        </h2>
      </div>
      <div className={classes.button}>
        <p>Contact us</p>
      </div>
    </div>
  );
};

export default Header;
