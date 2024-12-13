import { useHero } from "@/context/hero-context";
import classes from "./Loader.module.css";

const Loader = () => {
  const { loading, progress } = useHero();

  if (!loading) return null;

  return (
    <div className={classes.loader}>
      <h2>Loading... {Math.round(progress)}%</h2>
    </div>
  );
};

export default Loader;
