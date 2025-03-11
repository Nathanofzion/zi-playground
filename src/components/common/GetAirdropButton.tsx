import confetti from "canvas-confetti";
import { FC } from "react";

import { ButtonProps, Spinner } from "@chakra-ui/react";

import Button from "@/components/Button";
import useAirdrop, { Action } from "@/hooks/useAirdrop";

const defaults = {
  spread: 360,
  ticks: 50,
  gravity: 1,
  decay: 0.94,
  startVelocity: 30,
};

interface Props extends ButtonProps {
  action: Action;
  onReceive?: () => void;
}

const GetAirdropButton: FC<Props> = ({ action, onReceive, ...props }) => {
  const { isLoading, status, getAirdrop } = useAirdrop();

  return (
    <Button
      gap={1}
      disabled={status[action].data || isLoading}
      onClick={async () => {
        if (action) {
          const result = await getAirdrop(action);
          onReceive?.();
          if (result) {
            confetti({
              ...defaults,
              particleCount: 240,
              scalar: 1.2,
              zIndex: 1030,
            });
          }
        }
      }}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      Get airdrop
    </Button>
  );
};

export default GetAirdropButton;
