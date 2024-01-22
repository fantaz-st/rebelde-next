import Header from "../components/Header/Header";
import Slider from "../components/Slider/Slider";
import classes from "./page.module.css";

export default function Home() {
  return (
    <div className='app'>
      <Header />
      <div className={classes.loading}>
        <h1>Loading content...</h1>
      </div>
      <div className={classes.line33} />
      <div className={classes.line66} />
      <Slider />
    </div>
  );
}
