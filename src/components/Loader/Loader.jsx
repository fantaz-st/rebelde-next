import React, { useState, useEffect } from "react";

const Loader = ({ sentences }) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSentenceIndex((prevIndex) => (prevIndex + 1) % sentences.length);
    }, 2000);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [sentences.length]);

  return <h2>{sentences[currentSentenceIndex]}</h2>;
};

export default Loader;
