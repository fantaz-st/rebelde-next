"use client";

import Header from "../components/Header/Header";
import Slider from "../components/Slider/Slider";
import classes from "./page.module.css";
import SliderMenu from "@/components/SliderMenu/SliderMenu";
import { SliderContextProvider } from "@/context/slider-context";

export default function Home() {
  return (
    <div className='app'>
      <SliderContextProvider>
        <Header />
        <div className={classes.loading}>
          <h1>Loading videos...</h1>
        </div>
        <div className={classes.line33} />
        <div className={classes.line66} />
        <Slider />
        <SliderMenu />
      </SliderContextProvider>
    </div>
  );
}
