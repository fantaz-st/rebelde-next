import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import classes from "./LoadingMarquee.module.css";

const LoadingMarquee = () => {
  const marqueeRef = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia(),
      breakPoint = 800;

    mm.add(
      {
        isDesktop: `(min-width: ${breakPoint}px)`,
        isMobile: `(max-width: ${breakPoint - 1}px)`,
      },
      (context) => {
        let { isDesktop, isMobile } = context.conditions;

        let marquees = marqueeRef.current.querySelectorAll(`.${classes.wrapper}`);

        marquees.forEach(function (marquee) {
          let track = marquee.querySelector(`.${classes.track}`);
          let items = marquee.querySelectorAll(`.${classes.text}`);
          let tl = gsap.timeline({
            repeat: -1,
            defaults: { ease: isDesktop ? "expo.inOut" : "power1.inOut", duration: isDesktop ? 1 : 0.5, delay: isDesktop ? 1 : 0.5 },
          });

          items.forEach(function (item, index) {
            if (index < items.length - 1) {
              let distance = (index + 1) * -100;

              tl.to(track, { yPercent: distance, width: items[index + 1].offsetWidth });
            } else {
              gsap.set(track, { width: items[0].offsetWidth });
              tl.to(track, { yPercent: 0, width: items[0].offsetWidth });
            }
          });
        });
      }
    );
  }, []);

  return (
    <div className={classes.container} ref={marqueeRef}>
      <div className={classes.wrapper}>
        <div className={classes.track}>
          <div className={classes.text}>Experience the wonders of Croatia&apos;s Blue Cave and Blue Lagoon with our tailored boat tours – book now!</div>
          <div className={classes.text}>Experimenta las maravillas de la Cueva Azul y la Laguna Azul de Croacia con nuestros tours en barco personalizados. ¡Reserva ahora!</div>
          <div className={classes.text}>Esperienzia le meraviglie della Grotta Azzurra e della Laguna Blu della Croazia con i nostri tour in barca su misura. Prenota ora!</div>
          <div className={classes.text}>Erleben Sie die Wunder der Blauen Grotte und der Blauen Lagune Kroatiens mit unseren maßgeschneiderten Bootstouren. Jetzt buchen!</div>
          <div className={classes.text}>Découvrez les merveilles de la Grotte Bleue et de la Lagune Bleue de Croatie avec nos circuits en bateau sur mesure. Réservez maintenant!</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingMarquee;
