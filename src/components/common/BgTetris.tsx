"use client";

import { Box, BoxProps, Flex, FlexProps, Text, VStack } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";

import { useTetris } from "@/hooks/useTetris";
import { Block, BoardShape, CellOptions, SHAPES } from "@/types/tetris";
import Button from "./Button";

// Cell Component
function Cell({ type }: { type: CellOptions }) {
  return (
    <Box
      className={`${type} cell`}
      w={{ base: "18px", xl: "28px" }}
      borderRadius="lg"
    />
  );
}

interface BoardProps extends BoxProps {
  currentBoard: BoardShape;
}

// Board Component
const Board: FC<BoardProps> = ({ currentBoard, ...props }) => {
  return (
    <Box
      zIndex={50}
      userSelect="none"
      borderRadius="2xl"
      border="4px"
      borderColor="white"
      bg="black"
      p={1}
      {...props}
    >
      {currentBoard.map((row, rowIndex) => (
        <Box key={`${rowIndex}`} className="row">
          {row.map((cell, colIndex) => (
            <Cell key={`${rowIndex}-${colIndex}`} type={cell} />
          ))}
        </Box>
      ))}
    </Box>
  );
};

interface UpcomingBlocksProps extends FlexProps {
  upcomingBlocks: Block[];
}
// UpcomingBlocks Component
const UpcomingBlocks: FC<UpcomingBlocksProps> = ({
  upcomingBlocks,
  ...props
}) => {
  return (
    <Flex
      zIndex={50}
      w="full"
      direction={{ md: "column" }}
      justify="center"
      align="center"
      gap={8}
      {...props}
    >
      {upcomingBlocks.map((block, blockIndex) => {
        const shape = SHAPES[block].shape.filter((row) =>
          row.some((cell) => cell)
        );
        return (
          <Box key={blockIndex}>
            {shape.map((row, rowIndex) => {
              return (
                <Box key={rowIndex} className="row">
                  {row.map((isSet, cellIndex) => {
                    const cellClass = isSet ? block : "";
                    return (
                      <Box
                        key={`${blockIndex}-${rowIndex}-${cellIndex}`}
                        className={`cell ${cellClass}`}
                        w={{ base: "18px", xl: "28px" }}
                        borderRadius="lg"
                      />
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Flex>
  );
};

// LeadBoard Component
function LeadBoard({ lastUpdated }: { lastUpdated: number }) {
  const [scores, setScores] = useState<{ name: string; score: number }[]>([]);

  useEffect(() => {
    const localScores = localStorage.getItem("tetrisScores");
    if (localScores) {
      setScores(JSON.parse(localScores));
    }
  }, [lastUpdated]);

  return (
    <Box w="full" p={4} color="white">
      <Text textAlign="center" fontSize="xl" fontWeight="bold" mb={4}>
        Leaderboard
      </Text>
      <VStack gap={2} align="stretch">
        {scores
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((score, index) => (
            <Box key={index} display="flex" justifyContent="space-between">
              <Text>{score.name}</Text>
              <Text>{score.score}</Text>
            </Box>
          ))}
      </VStack>
    </Box>
  );
}

const Title = () => {
  return (
    <Text
      as="h1"
      className="tetris-title"
      textAlign="center"
      fontFamily="sans-serif"
      fontSize={{ base: "2xl", sm: "3xl", md: "6xl" }}
      fontWeight="extrabold"
    >
      <Text as="span" color="red.500">
        B
      </Text>
      <Text as="span" color="yellow.500">
        L
      </Text>
      <Text as="span" color="green.500">
        O
      </Text>
      <Text as="span" color="blue.500">
        C
      </Text>
      <Text as="span" color="purple.500">
        K
      </Text>
      <Text as="span" color="red.500">
        C
      </Text>
      <Text as="span" color="red.500">
        H
      </Text>
      <Text as="span" color="yellow.500">
        A
      </Text>
      <Text as="span" color="green.500">
        I
      </Text>
      <Text as="span" color="blue.500">
        N
      </Text>
      <Text ml={{ base: 4, md: 8 }} as="span" color="purple.500">
        T
      </Text>
      <Text as="span" color="red.500">
        E
      </Text>
      <Text as="span" color="red.500">
        T
      </Text>
      <Text as="span" color="yellow.500">
        R
      </Text>
      <Text as="span" color="green.500">
        I
      </Text>
      <Text as="span" color="blue.500">
        S
      </Text>
    </Text>
  );
};

// Main Tetris Component
const BgTetris = () => {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [bestScore, setBestScore] = useState("");

  const handleGameOver = async () => {
    // await addScore({ name: playerName, score });
    setGameStarted(false);
    setLastUpdated(Date.now());
  };

  const { board, startGame, isPlaying, score, upcomingBlocks } =
    useTetris(handleGameOver);

  const handleGameStart = async () => {
    setGameStarted(true);
    startGame();
  };

  useEffect(() => {
    const localScore = localStorage.getItem("tetrisScore");
    setBestScore(localScore ? JSON.parse(localScore) : 0);
  }, [score]);

  return (
    <Flex
      h="full"
      pt={{ base: 28, md: 36 }}
      direction="column"
      perspective="700px"
      bg="radial-gradient(rgba(118, 0, 191, 0.5) 0%, transparent 70%), linear-gradient(#0b161e 40%, #202076 70%)"
      color="white"
    >
      <Box className="gridx" />
      <Box className="lines" />

      <Title />

      <Flex
        flexGrow={1}
        w="full"
        direction={{ base: "column", xl: "row" }}
        gap={{ base: 2, sm: 4, md: 8 }}
      >
        <Flex
          order={{ base: 3, md: 1 }}
          w={{ base: "full", xl: "1/3" }}
          display={{ base: "none", md: "flex" }}
        >
          <LeadBoard lastUpdated={lastUpdated} />
        </Flex>

        <Flex
          order={2}
          w={{ base: "full", xl: "1/3" }}
          direction="column"
          align="center"
          gap={{ base: 2, sm: 4 }}
        >
          <Board currentBoard={board} border="2px solid white" />
          <Button size={{ base: "sm", md: "md" }} onClick={handleGameStart}>
            Start Game
          </Button>
        </Flex>

        <Flex
          order={{ base: 1, md: 2 }}
          w={{ base: "full", xl: "1/3" }}
          direction="column"
          gap={{ base: 2, sm: 4 }}
        >
          <Flex justify="center" gap={4}>
            <Text>Best score: {bestScore}</Text>
            {isPlaying && <Text>Score: {score}</Text>}
          </Flex>
          <UpcomingBlocks upcomingBlocks={upcomingBlocks} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default BgTetris;
