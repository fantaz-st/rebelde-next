"use client";

import { createContext, useRef, useState } from "react";

export const SliderContext = createContext({
  toggleActiveMenu: () => {},
  nextSlide: () => {},
  prevSlide: () => {},
});

export const SliderContextProvider = (props) => {
  const [activeMenu, setActiveMenu] = useState(false);

  const materialRef = useRef();

  const slideIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const indexRef = useRef();
  const captionRef = useRef();
  const transitionRef = useRef();
  const closeButtonRef = useRef();

  const toggleActiveMenu = () => {
    setActiveMenu((prev) => !prev);
  };

  const nextSlide = () => {
    if (transitionRef.current) {
      transitionRef.current();
    }
  };

  const prevSlide = () => {
    if (transitionRef.current) {
      transitionRef.current();
    }
  };

  const providerValues = {
    activeMenu,
    headerRef,
    footerRef,
    indexRef,
    captionRef,
    transitionRef,
    materialRef,
    slideIndexRef,
    isTransitioningRef,
    closeButtonRef,
    toggleActiveMenu,
    nextSlide,
    prevSlide,
  };

  return <SliderContext.Provider value={providerValues}>{props.children}</SliderContext.Provider>;
};
