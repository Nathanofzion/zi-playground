import { FC, useState } from "react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { Action } from "@/hooks/useAirdrop";

const AtomicModal: FC<ModalProps> = (props) => {
  const [showButton, setShowButton] = useState(false);

  return (
    <GuideModal
      title="Change theme"
      description="Try to change theme and get your ZI airdrop"
      action={Action.Atomic}
      showButton={showButton}
      showGradientBackground
      {...props}
    ></GuideModal>
  );
};

export default AtomicModal;
