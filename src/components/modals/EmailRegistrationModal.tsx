import { useRouter } from "next/navigation";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { SocialIcon } from "react-social-icons";
import { z } from "zod";

import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSorobanReact } from "@soroban-react/core";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "../common";
import Button from "../common/Button";
import Input from "../common/Input";
import { ModalProps } from "../common/Modal";
import { toaster } from "../ui/toaster";

const emailRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type EmailRegistrationFormData = z.infer<typeof emailRegistrationSchema>;

const EmailRegistrationModal: FC<ModalProps> = ({ onClose, ...props }) => {
  const queryClient = useQueryClient();
  const { address } = useSorobanReact();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailRegistrationFormData>({
    resolver: zodResolver(emailRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: EmailRegistrationFormData) => {
    try {
      if (!address) {
        throw new Error("Please connect your wallet to sign up");
      }

      await supabase.functions.invoke("auth", {
        method: "POST",
        body: {
          action: "update-profile",
          data: {
            token: localStorage.getItem("token"),
            email: data.email,
          },
        },
      });

      toaster.create({
        type: "success",
        title: "You have successfully signed up",
      });
      onClose?.();
      queryClient.invalidateQueries({ queryKey: ["user", address] });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error signing up:", error);
      toaster.create({
        type: "error",
        title: `Error: ${error instanceof Error ? error.message : error}`,
      });
    }
  };

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent
        p={8}
        w="full"
        maxW={{ base: "320px", lg: "420px" }}
        direction="column"
        gap={4}
      >
        <ModalCloseButton />
        <Heading as="h2" textAlign="center" size="lg">
          WELCOME
        </Heading>
        <Flex w="full" direction="column" align="center" gap={6}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <Flex w="full" direction="column" align="center" gap={4}>
              <Flex w="full" direction="column" gap={2}>
                <Input placeholder="Email" {...register("email")} />
                {errors.email && (
                  <Text color="red.500" fontSize="sm">
                    {errors.email.message}
                  </Text>
                )}
              </Flex>
              <Button w="80%" type="submit" loading={isSubmitting}>
                Register email
              </Button>
            </Flex>
          </form>
          <Box
            w="90%"
            h="0.3rem"
            bg="linear-gradient(to bottom right, #a588e4, #b7fee0)"
            rounded="0.8rem"
          />
          <HStack spaceX={6} justify="center">
            <SocialIcon network="facebook" />
            <SocialIcon network="whatsapp" />
            <SocialIcon network="x" />
          </HStack>
          <Text textAlign="center">
            Send Your Magic Link with Fb, WhatsApp, X & email.
          </Text>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default EmailRegistrationModal;
