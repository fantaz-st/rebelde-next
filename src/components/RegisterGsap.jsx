"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const RegisterGSAP = () => {
  useLayoutEffect(() => {
    gsap.registerPlugin(useGSAP);
  }, []);

  return null;
};

export default RegisterGSAP;
