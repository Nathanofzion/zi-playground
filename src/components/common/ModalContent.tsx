import { Flex, FlexProps } from "@chakra-ui/react";
import { FC, useContext } from "react";
import { useColorModeValue } from "../ui/color-mode";
import { ModalContext } from "./Modal";

const ModalContent: FC<FlexProps> = (props) => {
  const { isOpen } = useContext(ModalContext);

  return (
    <Flex
      position='fixed'
      zIndex={1020}
      transform='auto'
      left='50%' top='calc(50% + 25px)'
      translateX='-50%' translateY='-50%'
      display={isOpen ? 'flex' : 'none'}
      maxH='calc(100vh - 180px)'
      bg={useColorModeValue(
        'linear-gradient(#F8F8F880, #F8F8F880) padding-box, linear-gradient(to bottom right, #a588e480, #b7fee080) border-box;',
        'linear-gradient(#13141E80, #13141E80) padding-box, linear-gradient(to bottom right, #a588e480, #b7fee080) border-box;',
      )}
      color={useColorModeValue('#00615F', 'white')}
      shadow='0px 4px 10px 0px rgba(136, 102, 221, 0.1);'
      border='2px solid transparent'
      rounded='16px'
      overflowY='auto'
      {...props}
    />
  )
}

export default ModalContent;
