"use client";

import { useRef, useState } from "react";
import Header from "../components/Header/Header";
import Slider from "../components/Slider/Slider";
import classes from "./page.module.css";
import SliderMenu from "@/components/SliderMenu/SliderMenu";

export default function Home() {
  const [activeMenu, setActiveMenu] = useState(false);

  const toggleActiveMenu = () => {
    setActiveMenu((prev) => !prev);
  };

  const headerRef = useRef(null);
  return (
    <div className='app'>
      <Header headerRef={headerRef} onToggleMenu={toggleActiveMenu} />
      <div className={classes.loading}>
        <h1>Loading videos...</h1>
      </div>
      <div className={classes.line33} />
      <div className={classes.line66} />
      <Slider headerRef={headerRef} />
      <SliderMenu activeMenu={activeMenu} />
      <div className={activeMenu ? `${classes.menu_overlay} ${classes.active}` : classes.menu_overlay} onClick={() => setActiveMenu(false)} />
    </div>
  );
}
