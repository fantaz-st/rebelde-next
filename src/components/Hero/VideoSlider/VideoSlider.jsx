import CanvasContainer from "../CanvasContainer/CanvasContainer";

import Footer from "../Footer/Footer";
import Loader from "../Loader/Loader";
import Titles from "../Titles/Titles";
import classes from "./VideoSlider.module.css";
import { VideoSliderProvider } from "@/context/hero-context";

const VideoSlider = () => {
  return (
    <VideoSliderProvider>
      <div className={classes.container}>
        <Loader />
        {/* <CanvasContainer /> */}
        <Titles />
        <Footer />
      </div>
    </VideoSliderProvider>
  );
};

export default VideoSlider;
