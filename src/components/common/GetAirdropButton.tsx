import Button from "@/components/Button";
import useAirdrop, { Action } from "@/hooks/useAirdrop";
import { ButtonProps, Spinner } from "@chakra-ui/react";
import confetti from "canvas-confetti";
import { FC } from "react";

var defaults = {
  spread: 360,
  ticks: 50,
  gravity: 1,
  decay: 0.94,
  startVelocity: 30,
};

interface Props extends ButtonProps {
  action?: Action;
}

const GetAirdropButton: FC<Props> = ({ action }) => {
  const { getAirdrop, isGettingAirdrop } = useAirdrop();

  return (
    <Button
      gap={1}
      disabled={isGettingAirdrop}
      onClick={async () => {
        if (action) {
          await getAirdrop(action);
          confetti({
            ...defaults,
            particleCount: 240,
            scalar: 1.2,
            zIndex: 1030,
          });
        }
      }}
    >
      {isGettingAirdrop && <Spinner size="sm" />}
      Get airdrop
    </Button>
  );
};

export default GetAirdropButton;
