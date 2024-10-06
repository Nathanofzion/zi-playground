import React, { useState, useEffect } from "react";
import BgParticles from "./components/BgParticles";
import Hero from "./pages/Hero";
import sun from "./assets/sun.svg";
import moon from "./assets/moon.svg";

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Function to toggle between dark and light modes
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Effect to persist the theme choice to local storage
  useEffect(() => {
    // Retrieve the theme choice from local storage
    const savedTheme = localStorage.getItem("theme");

    // If a theme choice exists in local storage, set it as the current theme
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Effect to update local storage when the theme changes
  useEffect(() => {
    // Save the current theme choice to local storage
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  return (
    <>
      <Hero isDarkMode={isDarkMode} />
      <BgParticles isDarkMode={isDarkMode} />
      <div className="darkmodediv">
        {isDarkMode ? (
          <img
            src={moon}
            className="darkmodebtn"
            alt="Moon"
            onClick={toggleTheme}
          />
        ) : (
          <img
            src={sun}
            className="darkmodebtn"
            alt="Sun"
            onClick={toggleTheme}
          />
        )}
      </div>
    </>
  );
};

export default App;
