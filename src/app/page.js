import Header from "./components/Header/Header";
import Slider from "./components/Slider/Slider";
import classes from "./page.module.css";

export default function Home() {
  return (
    <div className='app'>
      <Header />
      <div className={classes.line} />
      <div className={classes.line} />
      <Slider />
    </div>
  );
}
