import { FC } from "react";

import { ButtonProps } from "@chakra-ui/react";

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
      disabled={status[action].data}
      loading={isLoading}
      onClick={async () => {
        if (action) {
          await getAirdrop(action);
          onReceive?.();
        }
      }}
      {...props}
    >
      Get airdrop
    </Button>
  );
};

export default GetAirdropButton;
