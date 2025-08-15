import { useRef } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { useGSAP } from "@gsap/react";
import horizontalLoop from "@/helpers/horizontalLoop";

import classes from "./Marquee.module.css";

gsap.registerPlugin(Observer, useGSAP);

function Marquee() {
  const container = useRef();

  useGSAP(
    () => {
      const loop = horizontalLoop(`.${classes.word}`, {
        repeat: -1,
        speed: 1.5,
        paddingRight: 16,
      });

      let tl;

      Observer.create({
        target: window,
        type: "wheel,touch",
        onChangeY: (self) => {
          tl && tl.kill();
          const factor = self.deltaY > 0 ? 1 : -1;
          tl = gsap
            .timeline()
            .to(loop, { timeScale: factor, duration: 0.25 })
            .to(loop, { timeScale: 1 * factor, duration: 1 });
        },
      });
    },
    { scope: container }
  );

  return (
    <div className={classes.container} ref={container}>
      <div className={classes.word}>Experience the wonders of Croatia&apos;s Blue Cave and Blue Lagoon with our tailored boat tours – book now!</div>
      <div className={classes.word}>Experience the wonders of Croatia&apos;s Blue Cave and Blue Lagoon with our tailored boat tours – book now!</div>
      <div className={classes.word}>Experience the wonders of Croatia&apos;s Blue Cave and Blue Lagoon with our tailored boat tours – book now!</div>
      <div className={classes.word}>Experience the wonders of Croatia&apos;s Blue Cave and Blue Lagoon with our tailored boat tours – book now!</div>
      <div className={classes.lol}></div>
    </div>
  );
}

export default Marquee;
