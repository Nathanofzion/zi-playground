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
  action: Action;
}

const GetAirdropButton: FC<Props> = ({ action, disabled, ...props }) => {
  const { isLoading, getAirdrop, status } = useAirdrop();

  return (
    <Button
      gap={1}
      disabled={status[action].data || isLoading}
      onClick={async () => {
        if (action) {
          const result = await getAirdrop(action);
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
