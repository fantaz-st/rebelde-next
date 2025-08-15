"use client";

import Header from "../components/Header/Header";
import Hero from "@/components/Hero/Hero";
import { HeroProvider } from "@/context/hero-context";
import classes from "./page.module.css";
import Menu from "@/components/Hero/Menu/Menu";

export default function Home() {
  return (
    <main>
      <div className={classes.app}>
        <HeroProvider>
          <Header />
          <Menu />
          <Hero />
        </HeroProvider>
      </div>
      {/* <Marquee /> */}
    </main>
  );
}
