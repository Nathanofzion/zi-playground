import { ClientOnly } from "@chakra-ui/react";
import { Button, ButtonProps } from "../ui/button";
import { useColorModeValue } from "../ui/color-mode";

export default function ({ children, ...props }: ButtonProps) {
  return (
    <ClientOnly>
      <Button
        position="relative"
        px={{ base: "8px", lg: "16px" }}
        bg="linear-gradient(to bottom right, #a588e480, #b7fee080)"
        fontSize={{ base: "14px", lg: "18px" }}
        fontWeight="bold"
        color={useColorModeValue("#00615F", "white")}
        border="none"
        rounded="full"
        _after={{
          content: '""',
          position: "absolute",
          zIndex: -1,
          width: "calc(100% - 4px)",
          height: "calc(100% - 4px)",
          bg: useColorModeValue("#F8F8F880", "#13141E80"),
          rounded: "full",
        }}
        _hover={{
          shadow: "40px 0 100px #a588e4",
          _after: {
            opacity: 0,
          },
        }}
        {...props}
      >
        {children}
      </Button>
    </ClientOnly>
  );
}
