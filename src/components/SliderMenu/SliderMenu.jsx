import Image from "next/image";
import slides from "@/helpers/slides";
import classes from "./SliderMenu.module.css";

const SliderMenu = ({ activeMenu }) => {
  return (
    <div className={activeMenu ? `${classes.menu} ${classes.active}` : classes.menu}>
      {slides.map((item, i) => (
        <div className={classes.menu_item} key={i}>
          <h2>{item.caption}</h2>
          <Image src={item.poster} alt={item.caption} fill style={{ objectFit: "cover" }} sizes='(min-width: 660px) 33.33vw, 100vw' />
        </div>
      ))}
    </div>
  );
};

export default SliderMenu;
