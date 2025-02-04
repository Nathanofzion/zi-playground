import { FC, useRef, useState } from "react";

import { Box, Text } from "@chakra-ui/react";

import { GuideModal } from "@/components/common";
import { ModalProps } from "@/components/common/Modal";
import Viewer from "@/components/Earth";
import { Action } from "@/hooks/useAirdrop";

const CubeGuideModal: FC<ModalProps> = (props) => {
    const isDownRef = useRef(false);
    const [showButton, setShowButton] = useState(false);

    return (
        <GuideModal
            title="Spin cube"
            description="Try to spin the cube and get your ZI airdrop"
            congratulation={
                <Text fontSize='sm'>
                    Great you’ve spun the cube, now check your balance and See your first Zi airdrop, and move to step 3). For your next Zi airdrop
                </Text>
            }
            action={Action.SpinCube}
            showButton={showButton}
            {...props}
        >
            <Box
                aspectRatio={1}
                onMouseMove={() => setShowButton(showButton || isDownRef.current)}
                onTouchMove={() => setShowButton(showButton || isDownRef.current)}
                onMouseDown={() => isDownRef.current = true}
                onTouchStart={() => isDownRef.current = true}
                onMouseUp={() => isDownRef.current = false}
                onTouchEnd={() => isDownRef.current = true}
            >
                <Viewer />
            </Box>
        </GuideModal >
    )
}

export default CubeGuideModal;
