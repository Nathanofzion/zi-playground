import { FC, useMemo, useState } from "react";
import { LuChevronDown } from "react-icons/lu";

import { Box, Flex, Input, Popover, Text } from "@chakra-ui/react";

import usePairs from "@/hooks/usePairs";
import { CloseButton } from "../ui/close-button";
import { useColorModeValue } from "../ui/color-mode";
import PairCard from "./PairCard";

interface Props {
  selectedPairId: number | null;
  onSelectPair: (pairId: number) => void;
}

const PairSelect: FC<Props> = ({ selectedPairId, onSelectPair }) => {
  const { pairs } = usePairs();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedPair = useMemo(
    () => pairs.find((pair) => pair.id == selectedPairId),
    [pairs, selectedPairId]
  );

  const filteredPairs = useMemo(
    () =>
      pairs.filter(
        (pair) =>
          pair.code.toLowerCase().indexOf(search.toLowerCase()) >= 0 ||
          pair.name.toLowerCase().indexOf(search.toLowerCase()) >= 0
      ),
    [pairs, search]
  );

  return (
    <Popover.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Popover.Trigger asChild>
        <Flex justify="space-between" align="center">
          {selectedPair ? (
            <PairCard flexGrow={1} pair={selectedPair} />
          ) : (
            "Select pair"
          )}
          <LuChevronDown color="white" />
        </Flex>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          bg={useColorModeValue(
            "linear-gradient(#F8F8F880, #F8F8F880) padding-box, linear-gradient(to bottom right, #a588e480, #b7fee080) border-box;",
            "linear-gradient(#13141E80, #13141E80) padding-box, linear-gradient(to bottom right, #a588e480, #b7fee080) border-box;"
          )}
          color={useColorModeValue("#00615F", "white")}
          shadow="0px 4px 10px 0px rgba(136, 102, 221, 0.1);"
          border="2px solid transparent"
          rounded="16px"
        >
          <Popover.Body p={2}>
            <Flex direction="column" gap={2}>
              <Flex justify="space-between" align="center">
                <Text p={1}>Select pair</Text>
                <Popover.CloseTrigger>
                  <CloseButton as={Box} size="xs" />
                </Popover.CloseTrigger>
              </Flex>
              <Input
                px={2}
                placeholder="Search pairs"
                rounded="full"
                onChange={(e) => setSearch(e.target.value)}
              />
              <Flex maxH={48} pr={1} direction="column" overflowY="auto">
                {filteredPairs.map((pair) => (
                  <PairCard
                    key={pair.id}
                    pair={pair}
                    _hover={{ bg: "#fff2" }}
                    onClick={() => {
                      onSelectPair(pair.id);
                      setOpen(false);
                    }}
                  />
                ))}
              </Flex>
            </Flex>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};

export default PairSelect;
