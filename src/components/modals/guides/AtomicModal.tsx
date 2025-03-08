import { FC } from "react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { Action } from "@/hooks/useAirdrop";

const AtomicModal: FC<ModalProps> = (props) => {
  return (
    <GuideModal
      title="Change theme"
      description="Try to change theme and get your ZI airdrop"
      action={Action.Atomic}
      showButton={false}
      showGradientBackground
      {...props}
    ></GuideModal>
  );
};

export default AtomicModal;
