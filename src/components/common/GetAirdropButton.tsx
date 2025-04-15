import { FC } from "react";

import { ButtonProps, Spinner } from "@chakra-ui/react";

import Button from "@/components/common/Button";
import { Action } from "@/enums";
import useAirdrop from "@/hooks/useAirdrop";

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
          await getAirdrop(action);
          onReceive?.();
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
