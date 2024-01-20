import classes from "./Header.module.css";

const Header = () => {
  return (
    <div className={classes.header}>
      <div className={classes.logo}>
        <h2>
          <span>R</span>BD
        </h2>
      </div>
      <div className={classes.button}>
        <p>Contact us</p>
      </div>
    </div>
  );
};

export default Header;
