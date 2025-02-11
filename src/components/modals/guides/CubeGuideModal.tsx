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
            title="Spin block"
            description="Try Spinning the Block to get your 1st Zi Airdrop"
            congratulation={
                <Text fontSize='sm'>
                    Great, you’ve spun the Block, now check your balance to see your 1st Zi Airdrop. Then move on to Step 3).
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
                <Viewer startAnimation={showButton} />
            </Box>
        </GuideModal >
    )
}

export default CubeGuideModal;
