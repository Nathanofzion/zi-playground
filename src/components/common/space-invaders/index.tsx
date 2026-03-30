import { useEffect, useRef, useState } from "react";

import { Engine } from "@babylonjs/core";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";

import { GameType } from "@/enums";
import useScore from "@/hooks/useScore";
import { truncateAddress } from "@/utils";
import { Environment } from "./Environment";
import { GameAssetsManager } from "./GameAssetsManager";
import { GameController } from "./GameController";
import { InputController } from "./InputController";
import State from "./State";
import { UIText } from "./UIText";
import spaceinvadersConfig from "./config";

import "./index.css";

const BgSpaceInvaders = () => {
  const { createScore, scores } = useScore(GameType.SPACE_INVADERS);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const canvasRef = useRef<any>(null);
  const engineRef = useRef<any>(null);
  const gameControllerRef = useRef<any>(null);
  const lastRenderTimeRef = useRef(0);
  const FPSRef = useRef(60);

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

  useEffect(() => {
  if (!canvasRef.current) return;

  // ✅ Cancellation flag
  let isMounted = true;

  const canvas = canvasRef.current;
  const engine = new Engine(canvas, true);
  engineRef.current = engine;

  const environment = new Environment(engine);
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

  if (spaceinvadersConfig.oldSchoolEffects.enabled) {
    FPSRef.current = 18;
  }

  const renderLoop = () => {
    // ✅ Don't render if component has unmounted
    if (!isMounted) return;

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

  const handleResize = () => engine.resize();
  window.addEventListener("resize", handleResize);

  parseSelectedMode(); // move this function outside useEffect

  return () => {
    // ✅ Signal cancellation BEFORE disposing
    isMounted = false;

    engine.stopRenderLoop(renderLoop);
    window.removeEventListener("resize", handleResize);

    // ✅ Small delay gives in-flight async ops time to see isMounted=false
    // before the scene is actually disposed
    setTimeout(() => {
      engine.dispose();
    }, 100);
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
        <p>
          <Button
            background="transparent"
            color="#0f0"
            border="2px solid #0f0"
            padding="10px 10px 8px"
            position="relative"
            fontSize="1.2em"
            onClick={() => setShowLeaderboard(true)}
          >
            LEADERBOARD
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
      {showLeaderboard && (
        <Flex
          position="fixed"
          top={{ base: "96px", lg: "118px" }}
          left={0}
          right={0}
          bottom={0}
          zIndex={50}
          bg="rgba(0,0,0,0.92)"
          direction="column"
          align="center"
          p={6}
          overflow="auto"
        >
          <Text color="#0f0" fontSize="xl" fontWeight="bold" mb={4}>
            Leaderboard
          </Text>
          <VStack gap={2} align="stretch" w="full" maxW="400px" mb={4}>
            {scores && scores.length > 0 ? (
              scores.map((s) => (
                <Box key={s.id} display="flex" justifyContent="space-between" color="#0f0" fontSize="sm">
                  <Text>{truncateAddress(s.publicKey)}</Text>
                  <Text fontWeight="bold">{s.score}</Text>
                  <Text opacity={0.7}>{new Date(s.created_at).toLocaleDateString()}</Text>
                </Box>
              ))
            ) : (
              <Text color="#0f0" textAlign="center" opacity={0.7}>No scores yet</Text>
            )}
          </VStack>
          <Button
            background="transparent"
            color="#0f0"
            border="2px solid #0f0"
            padding="8px 16px"
            onClick={() => setShowLeaderboard(false)}
          >
            Close
          </Button>
        </Flex>
      )}
    </div>
  );
};

export default BgSpaceInvaders;