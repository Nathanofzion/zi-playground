import { Input, InputProps } from "@chakra-ui/react";

export default function (props: InputProps) {
  return (
    <Input
      p="1rem"
      bg="rgba(255, 255, 255, 0.15)"
      border="none"
      rounded="full"
      shadow="0 8px 32px 0 rgba(31, 38, 135, 0.37)"
      {...props}
    />
  );
}
