"use client";

import { FC, useState } from "react";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaPlay,
  FaTrophy,
  FaUndo,
} from "react-icons/fa";

import { Box, BoxProps, Flex, FlexProps, Text } from "@chakra-ui/react";

import { GameType } from "@/enums";
import useScore from "@/hooks/useScore";
import { useTetris } from "@/hooks/useTetris";
import { Action } from "@/hooks/useTetrisBoard";
import { Block, BoardShape, CellOptions, SHAPES } from "@/types/tetris";
import Button from "./Button";
import LeaderBoard from "./LeaderBoard";

// Cell Component
function Cell({ type }: { type: CellOptions }) {
  return (
    <Box
      className={`${type} cell`}
      w={{ base: "18px", xl: "20px" }}
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
                        w={{ base: "18px", xl: "20px" }}
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

const Title = () => {
  return (
    <Text
      as="h1"
      className="tetris-title"
      textAlign="center"
      fontFamily="sans-serif"
      fontSize={{ base: "2xl", md: "4xl" }}
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

interface ControllerProps extends FlexProps {
  move: (value: Action) => void;
  down: () => void;
  release: () => void;
}

const Controller: FC<ControllerProps> = ({ move, down, release, ...props }) => {
  return (
    <Flex
      position="absolute"
      bottom={0}
      display={{ base: "flex", md: "none" }}
      px={4}
      w="full"
      h="full"
      justify="space-between"
      align="center"
      {...props}
    >
      <Flex direction="column" gap={4}>
        <Button onClick={() => move({ type: "move", isPressingLeft: true })}>
          <FaArrowLeft />
        </Button>
        <Button onClick={() => move({ type: "move", isRotating: true })}>
          <FaUndo />
        </Button>
      </Flex>
      <Flex direction="column" gap={4}>
        <Button onClick={() => move({ type: "move", isPressingRight: true })}>
          <FaArrowRight />
        </Button>
        <Button onTouchStart={down} onTouchEnd={release}>
          <FaArrowDown />
        </Button>
      </Flex>
    </Flex>
  );
};
// Main Tetris Component
const BgTetris = () => {
  const { createScore } = useScore(GameType.TETRIS);
  const [isOpen, setIsOpen] = useState(false);

  const handleGameOver = async () => {
    createScore(score);
  };

  const {
    board,
    startGame,
    move,
    isPlaying,
    score,
    upcomingBlocks,
    down,
    release,
  } = useTetris(handleGameOver);

  const handleGameStart = async () => {
    startGame();
  };

  return (
    <Flex
      h="full"
      pt={{ base: 28, md: 36 }}
      direction="column"
      perspective="700px"
      bg="radial-gradient(rgba(118, 0, 191, 0.5) 0%, transparent 70%), linear-gradient(#0b161e 40%, #202076 70%)"
      color="white"
    >
      <LeaderBoard
        type={GameType.TETRIS}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      <Flex direction="column" align="center" gap={2}>
        <Title />
        {isPlaying && <Text>Score: {score}</Text>}
        <UpcomingBlocks upcomingBlocks={upcomingBlocks} />
        <Flex w="full" position="relative" justify="center">
          <Board currentBoard={board} border="2px solid white" />
          <Controller move={move} down={down} release={release} />
          <Button
            position="absolute"
            display={{ base: "flex", md: "none" }}
            bottom={0}
            left={4}
            onClick={handleGameStart}
          >
            <FaPlay />
          </Button>
          <Button
            position="absolute"
            bottom={0}
            right={4}
            display={{ base: "flex", md: "none" }}
            onClick={() => setIsOpen(true)}
          >
            <FaTrophy />
          </Button>
        </Flex>
        <Flex gap={4}>
          <Button
            display={{ base: "none", md: "flex" }}
            onClick={handleGameStart}
          >
            <FaPlay />
          </Button>
          <Button
            display={{ base: "none", md: "flex" }}
            onClick={() => setIsOpen(true)}
          >
            <FaTrophy />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default BgTetris;
