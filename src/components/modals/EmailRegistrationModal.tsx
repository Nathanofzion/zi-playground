import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Flex, Heading, Text } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSorobanReact } from "@soroban-react/core";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import useUser from "@/hooks/useUser";
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
  const { user } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const existingEmail: string | null = user?.email ?? null;
  const showForm = !existingEmail || isEditing;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmailRegistrationFormData>({
    resolver: zodResolver(emailRegistrationSchema),
    mode: "onChange",
    defaultValues: { email: existingEmail ?? "" },
  });

  // Pre-populate form when user data loads
  useEffect(() => {
    if (existingEmail) {
      reset({ email: existingEmail });
    }
  }, [existingEmail, reset]);

  const onSubmit = async (data: EmailRegistrationFormData) => {
    try {
      if (!address) {
        throw new Error("Please connect your wallet to sign up");
      }

      const { error } = await supabase.functions.invoke("auth", {
        method: "POST",
        body: {
          action: "update-profile",
          data: {
            token: localStorage.getItem("token"),
            email: data.email,
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to register email");
      }

      toaster.create({
        type: "success",
        title: existingEmail ? "Email updated successfully" : "You have successfully signed up",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["user", address] });
      if (!existingEmail) {
        onClose?.();
        router.push("/dashboard");
      }
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
          {existingEmail && !isEditing ? "WELCOME BACK" : "WELCOME"}
        </Heading>
        <Flex w="full" direction="column" align="center" gap={6}>
          {existingEmail && !isEditing ? (
            <Flex direction="column" align="center" gap={2} w="full">
              <Text fontSize="sm" color="gray.500">Registered email</Text>
              <Text fontWeight="semibold">{existingEmail}</Text>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Change email
              </Button>
            </Flex>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
              <Flex w="full" direction="column" align="center" gap={4}>
                <Flex w="full" direction="column" gap={2}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="email"
                        placeholder="Email"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  {errors.email && (
                    <Text color="red.500" fontSize="sm">
                      {errors.email.message}
                    </Text>
                  )}
                </Flex>
                <Flex gap={2} w="80%" justify="center">
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => { setIsEditing(false); reset({ email: existingEmail ?? "" }); }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button w={isEditing ? "auto" : "full"} type="submit" loading={isSubmitting}>
                    {existingEmail ? "Update email" : "Register email"}
                  </Button>
                </Flex>
              </Flex>
            </form>
          )}
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default EmailRegistrationModal;
