import { FC, useState } from "react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import { Action } from "@/hooks/useAirdrop";

const SpaceInvadersModal: FC<ModalProps> = (props) => {
  const [showButton, setShowButton] = useState(false);

  return (
    <GuideModal
      title="Change theme"
      description="Try to change theme and get your ZI airdrop"
      action={Action.ChangeTheme}
      showButton={showButton}
      _modalContent={{ width: "480px" }}
      {...props}
    >
      <iframe src="https://spaceinvaders.viperfish.com.au/" height={360} />
    </GuideModal>
  );
};

export default SpaceInvadersModal;
