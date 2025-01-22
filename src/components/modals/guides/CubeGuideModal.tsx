import { FC } from "react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import Viewer from "@/components/Earth";
import { Box } from "@chakra-ui/react";

const CubeGuideModal: FC<ModalProps> = (props) => {
    return (
        <GuideModal title="Spin cube" description="Try to spin the cube and get your ZI airdrop" {...props}>
            <Box aspectRatio={1}>
                <Viewer />
            </Box>
        </GuideModal>
    )
}

export default CubeGuideModal;
