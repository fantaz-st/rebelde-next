import { useContext } from "react";
import classes from "./Loader.module.css";
import { VideoSliderContext } from "@/context/hero-context2";

const Loader = () => {
  const ctx = useContext(VideoSliderContext);
  const { loading, progress } = ctx;
  return <div className={classes.container}>{loading && <div className={classes.loader}>Loading... {Math.round(progress)}%</div>}</div>;
};

export default Loader;
