"use client";

import Loader from "@/components/Loader/Loader";
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
          <Loader
            sentences={[
              "Experience the wonders of Croatia's Blue Cave and Blue Lagoon with our tailored boat tours – book now!",
              "Experimenta las maravillas de la Cueva Azul y la Laguna Azul de Croacia con nuestros tours en barco personalizados. ¡Reserva ahora!",
              "Esperienzia le meraviglie della Grotta Azzurra e della Laguna Blu della Croazia con i nostri tour in barca su misura. Prenota ora!",
              "Erleben Sie die Wunder der Blauen Grotte und der Blauen Lagune Kroatiens mit unseren maßgeschneiderten Bootstouren. Jetzt buchen!",
              "Découvrez les merveilles de la Grotte Bleue et de la Lagune Bleue de Croatie avec nos circuits en bateau sur mesure. Réservez maintenant!",
            ]}
          />
        </div>
        <div className={classes.line33} />
        <div className={classes.line66} />
        <Slider />
        <SliderMenu />
      </SliderContextProvider>
    </div>
  );
}
