import slides from "../data";
import classes from "./Menu.module.css";
import Image from "next/image";
import { useHero } from "@/context/hero-context";

const Menu = () => {
  const { activeMenu, toggleActiveMenu, goToSlide, changeSlide } = useHero();

  const handleClick = (index) => {
    toggleActiveMenu();
    setTimeout(() => {
      goToSlide(index);
      changeSlide(index);
    }, 600);
  };
  return (
    <div className={classes.container}>
      <div className={activeMenu ? `${classes.menu} ${classes.active}` : classes.menu}>
        {slides.map((item, i) => (
          <div className={classes.menu_item} key={i} onClick={() => handleClick(i)}>
            <h2>{item.caption}</h2>
            <Image src={item.img} alt={item.caption} fill style={{ objectFit: "cover" }} sizes='(min-width: 660px) 33.33vw, 100vw' priority />
          </div>
        ))}
      </div>
      <div className={activeMenu ? `${classes.menu_overlay} ${classes.active}` : classes.menu_overlay} onClick={toggleActiveMenu} />
    </div>
  );
};

export default Menu;
