import { FC, useState } from "react";

import { Box, Flex, Table, Text } from "@chakra-ui/react";

import { GameType } from "@/enums";
import useScore from "@/hooks/useScore";
import { truncateAddress } from "@/utils";
import Button from "./Button";
import Modal from "./Modal";
import ModalCloseButton from "./ModalCloseButton";
import ModalContent from "./ModalContent";
import ModalOverlay from "./ModalOverlay";

interface Props {
  type: GameType;
}

const LeaderBoard: FC<Props> = ({ type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);

  const { scores } = useScore(type);

  return (
    <>
      <Box position="fixed" bottom={4} left={4} zIndex={100}>
        <Button onClick={() => setIsOpen(true)}>
          Leaderboard
        </Button>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent p={4}>
          <ModalCloseButton />
          <Flex direction="column" gap={4}>
            <Text fontSize="xl">Leaderboard</Text>
            <Table.Root 
              variant="outline" 
              size="md"
              colorScheme="purple"
              bg="whiteAlpha.50"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="sm"
            >
              <Table.Header bg="purple.500">
                <Table.Row>
                  <Table.ColumnHeader 
                    color="white" 
                    fontWeight="bold" 
                    textAlign="center"
                    width="60px"
                  >
                    #
                  </Table.ColumnHeader>
                  <Table.ColumnHeader 
                    color="white" 
                    fontWeight="bold"
                  >
                    Address
                  </Table.ColumnHeader>
                  <Table.ColumnHeader 
                    color="white" 
                    fontWeight="bold" 
                  >
                    Score
                  </Table.ColumnHeader>
                  <Table.ColumnHeader 
                    color="white" 
                    fontWeight="bold"
                  >
                    Date
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {scores?.map((score, index) => (
                  <Table.Row 
                    key={score.id}
                    _hover={{ bg: "purple.50" }}
                    transition="background-color 0.2s"
                    bg={index % 2 === 0 ? "whiteAlpha.50" : "transparent"}
                  >
                    <Table.Cell 
                      textAlign="center" 
                      fontWeight="semibold"
                      color="purple.600"
                    >
                      {index + 1}
                    </Table.Cell>
                    <Table.Cell 
                      fontFamily="mono" 
                      fontSize="sm"
                      color="gray.700"
                    >
                      {truncateAddress(score.publicKey)}
                    </Table.Cell>
                    <Table.Cell 
                      fontWeight="bold"
                      color="purple.700"
                    >
                      {score.score.toLocaleString()}
                    </Table.Cell>
                    <Table.Cell 
                      fontSize="sm"
                      color="gray.600"
                    >
                      {new Date(score.created_at).toLocaleDateString()}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LeaderBoard;
