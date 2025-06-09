import React, { useEffect, useRef, useState } from "react";

import { Engine } from "@babylonjs/core";

import { Environment } from "./Environment";
import { GameAssetsManager } from "./GameAssetsManager";
import { GameController } from "./GameController";
import { InputController } from "./InputController";
import State from "./State";
import { UIText } from "./UIText";
import spaceinvadersConfig from "./config";

import "./index.css";
import { Button } from "@chakra-ui/react";

const BgSpaceInvaders = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDots, setLoadingDots] = useState("");
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const gameControllerRef = useRef(null);
  const lastRenderTimeRef = useRef(0);
  const FPSRef = useRef(60);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize game
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    engineRef.current = engine;

    const environment = new Environment(engine);
    // const stars = new Starfield(environment.scene);
    // const deltaTime = new DeltaTime(environment.scene);
    const gameAssets = new GameAssetsManager(environment.scene);
    const inputController = new InputController(environment.scene);
    const UI = new UIText();
    const gameController = new GameController(
      environment,
      inputController,
      gameAssets,
      UI
    );
    gameControllerRef.current = gameController;

    // Set FPS based on mode
    if (spaceinvadersConfig.oldSchoolEffects.enabled) {
      FPSRef.current = 18;
    }

    // Game loop
    const renderLoop = () => {
      if (gameAssets.isComplete) {
        switch (State.state) {
          case "LOADING":
            break;
          case "TITLESCREEN":
            gameController.titleScreen();
            break;
          case "STARTGAME":
            // engine.audioEngine.unlock();
            gameController.startGame();
            break;
          case "NEXTLEVEL":
            gameController.nextLevel();
            break;
          case "GAMELOOP":
            gameController.checkStates();
            break;
          case "ALIENSWIN":
            gameController.aliensWin();
            break;
          case "CLEARLEVEL":
            gameController.clearLevel();
            break;
          case "GAMEOVER":
            gameController.gameOver();
            break;
          default:
            break;
        }

        // Force low FPS if required
        let timeNow = Date.now();
        while (timeNow - lastRenderTimeRef.current < 1000 / FPSRef.current) {
          timeNow = Date.now();
        }
        lastRenderTimeRef.current = timeNow;
        window.scrollTo(0, 0);
        environment.scene.render();
      }
    };

    engine.runRenderLoop(renderLoop);

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    // Parse selected mode
    const parseSelectedMode = () => {
      const mode = parseInt(window.localStorage.getItem("mode") ?? "0");
      document.body.classList.add(`mode${mode}`);
      switch (mode) {
        case 0:
          break;
        case 1:
          spaceinvadersConfig.oldSchoolEffects.enabled = true;
          break;
        case 2:
          spaceinvadersConfig.actionCam = true;
          break;
        default:
          break;
      }
    };
    parseSelectedMode();

    // Cleanup
    return () => {
      engine.stopRenderLoop(renderLoop);
      window.removeEventListener("resize", handleResize);
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const loadingInterval = setInterval(() => {
      if (isLoading) {
        setLoadingDots((prev) => prev + ".");
      }
    }, 1000);

    return () => clearInterval(loadingInterval);
  }, [isLoading]);

  const handleModeChange = (event) => {
    const mode = parseInt(event.target.value);
    window.localStorage.setItem("mode", mode.toString());
    document.body.classList.remove("mode0", "mode1", "mode2");
    document.body.classList.add(`mode${mode}`);

    // Update config based on mode
    spaceinvadersConfig.oldSchoolEffects.enabled = mode === 1;
    spaceinvadersConfig.actionCam = mode === 2;

    // Update FPS if needed
    FPSRef.current = mode === 1 ? 18 : 60;
  };

  const handleStartGame = () => {
    setIsLoading(false);
    State.state = "STARTGAME";
  };

  const handlePlayAgain = () => {
    State.state = "STARTGAME";
  };

  return (
    <div id="container">
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      <div id="ui" className="active">
        <div id="title-screen" className="active">
          <div id="title">
            <div className="layer layer1">
              SPACE
              <br />
              INVADERS
            </div>
            <div className="layer layer2">
              SPACE
              <br />
              INVADERS
            </div>
            <div className="layer layer3">
              SPACE
              <br />
              INVADERS
            </div>
          </div>
          <div id="portrait-warning">Best played in landscape</div>
          <div id="credits">
            <div>
              <p>------</p>
              <p>
                Arrow keys to move <br />
                Shift, Space or Enter to shoot
              </p>
              <p>------</p>
            </div>
          </div>
        </div>
        <div id="game-ui" className="">
          <div id="panel-game-over" className="">
            GAME OVER
          </div>
          <div id="panel-new-highscore" className="">
            **** NEW HIGH SCORE ****
            <br />
            <div className="value">0</div>
          </div>
          <div id="panel-game-hints">
            ---==Ξ <span className="lg">!</span> Ξ==---
            <div className="value"></div>
            ---==Ξ==---
          </div>
        </div>
      </div>
      <div id="loading" className={isLoading ? "active" : ""}>
        LOADING
        <br />
        {loadingDots}
      </div>
      <div id="intro" className="">
        <p>
          Select mode
          <br />
          <select id="change-mode" onChange={handleModeChange}>
            <option value="0">Traditional 2D</option>
            <option value="1">2D oldschool CRT</option>
            <option value="2">Action cam 3D</option>
          </select>
        </p>
        <p>
          <Button
            background="transparent"
            color="#0f0"
            border="2px solid #0f0"
            padding="10px 10px 8px"
            position="relative"
            fontSize="1.2em"
            id="start-game"
            onClick={handleStartGame}
          >
            START GAME
          </Button>
        </p>
      </div>
      <div id="panel-play-again" className="">
        <Button
          background="transparent"
          color="#0f0"
          border="2px solid #0f0"
          padding="10px 10px 8px"
          position="relative"
          fontSize="1.2em"
          id="play-again"
          onClick={handlePlayAgain}
        >
          PLAY AGAIN
        </Button>
      </div>
    </div>
  );
};

export default BgSpaceInvaders;
