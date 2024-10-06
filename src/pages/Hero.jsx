import React, { useState } from "react";
import Earth from "../components/Earth";

const Hero = ({ isDarkMode }) => {
  const [startAnimation, setStartAnimation] = useState(false);

  const handleLogin = () => {
    setStartAnimation(true);
  };

  const MatrixText = ({ text, delay }) => (
    <span
      className={`matrix-text ${startAnimation ? "fall-in" : ""}`}
      style={{
        color: isDarkMode ? "#fff" : "#000",
        fontSize:
          text === "Choose A Wallet To Login"
            ? "3rem"
            : delay === 0
            ? "2rem"
            : "1rem",
        fontWeight: delay === 0 ? "bold" : "normal",
        animationDelay: `${delay}s`,
        display: "block",
        whiteSpace: "pre-wrap",
        marginTop: "1rem",
      }}
    >
      {text}
    </span>
  );

  const GridItem = ({ title, text, url, buttonUrl }) => (
    <div style={{ flex: 1 }}>
      <MatrixText text={title} delay={0} />
      <MatrixText text={text} delay={title.length * 0.1} />
      <MatrixText text={url} delay={(title.length + text.length) * 0.1} />
      <a
        href={buttonUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <button
          style={{
            marginTop: "2rem",
            backgroundColor: "rgb(0, 107, 107)",
            color: "#fff",
            padding: ".7rem 1.5rem",
            borderRadius: "0.7rem",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
            display: "block",
            margin: "1rem auto",
          }}
        >
          Connect
        </button>
      </a>
    </div>
  );

  return (
    <div className="container">
      <div className="hero-div">
        <div className="hero-subdiv hero-model">
          <Earth startAnimation={startAnimation} />
        </div>
        <div className="hero-subdiv hero-2" style={{ zIndex: 10 }}>
          <div>
            {startAnimation ? (
              <>
                <MatrixText text="Choose A Wallet To Login" delay={0} />
                <div
                  style={{
                    width: "90%",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    margin: "0 auto",
                    textAlign: "center",
                  }}
                >
                  <GridItem
                    title="Zig3 V1 "
                    text="The First wallet Integration"
                    url="Zig3.uk "
                    buttonUrl="https://zig3.uk"
                  />
                  <GridItem
                    title="Zig3 V2"
                    text="The Latest in Wallet Technology"
                    url="Zig3.org "
                    buttonUrl="https://zig3.org"
                  />
                  <GridItem
                    title="Zig3 Web3 "
                    text="The Web3 Domain use Brave to Browse"
                    url="Zig3.wallet"
                    buttonUrl="https://zig3.wallet"
                  />
                </div>
              </>
            ) : (
              <>
                <h1
                  style={{
                    color: isDarkMode ? "#fff" : "#000",
                    fontSize: "4rem",
                    fontWeight: "bold",
                  }}
                >
                  Connect the World With Zig3
                </h1>
                <button className="loginbtn" onClick={handleLogin}>
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Media query to adjust text sizes on smaller viewports */}
      <style jsx>{`
        @media (max-width: 768px) {
          .matrix-text {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;
