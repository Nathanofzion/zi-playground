import { useEffect, useRef } from "react";

import { Engine } from "@babylonjs/core";
import { Button } from "@chakra-ui/react";

import { GameType } from "@/enums";
import useScore from "@/hooks/useScore";
import { Environment } from "./Environment";
import { GameAssetsManager } from "./GameAssetsManager";
import { GameController } from "./GameController";
import { InputController } from "./InputController";
import State from "./State";
import { UIText } from "./UIText";
import spaceinvadersConfig from "./config";

import "./index.css";

const BgSpaceInvaders = () => {
  const { createScore } = useScore(GameType.SPACE_INVADERS);
  const canvasRef = useRef<any>(null);
  const engineRef = useRef<any>(null);
  const gameControllerRef = useRef<any>(null);
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
            if (State.gameOverStep == 0) {
              createScore(State.score);
            }
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
  }, [createScore]);

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
      <div id="loading" className="active">
        LOADING
        <br />
        ...
      </div>
      <div id="intro" className="">
        <p>
          Select mode
          <br />
          <select id="change-mode">
            <option value="0">Traditional 2D</option>
            <option value="1">2D oldschool CRT</option>
            <option value="2">Action cam 3D</option>
          </select>
        </p>
        <p>
          <Button
            id="start-game"
            background="transparent"
            color="#0f0"
            border="2px solid #0f0"
            padding="10px 10px 8px"
            position="relative"
            fontSize="1.2em"
          >
            START GAME
          </Button>
        </p>
      </div>
      <div id="panel-play-again" className="">
        <Button
          id="play-again"
          background="transparent"
          color="#0f0"
          border="2px solid #0f0"
          padding="10px 10px 8px"
          position="relative"
          fontSize="1.2em"
        >
          PLAY AGAIN
        </Button>
      </div>
    </div>
  );
};

export default BgSpaceInvaders;
