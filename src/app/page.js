"use client";

import Header from "../components/Header/Header";
import Slider from "../components/Slider/Slider";
import classes from "./page.module.css";
import SliderMenu from "@/components/SliderMenu/SliderMenu";
import { SliderContextProvider } from "@/context/slider-context";
import Loading from "@/components/Loading/Loading";
import Marquee from "@/components/Marquee/Marquee";
import VideoSlider from "@/components/VideoSlider/VideoSlider";
import Fuck from "@/components/Fuck/Fuck";

export default function Home() {
  return (
    <main>
      <div className={classes.app}>
        <Fuck />
        {/* <VideoSlider /> */}
        {/* <SliderContextProvider>
          <Header />
          <Loading />
          <div className={classes.line33} />
          <div className={classes.line66} />
          <Slider />
          <SliderMenu />
        </SliderContextProvider> */}
      </div>
      {/* <Marquee /> */}
    </main>
  );
}
