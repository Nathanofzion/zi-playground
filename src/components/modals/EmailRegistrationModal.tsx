import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SocialIcon } from "react-social-icons";
import { z } from "zod";

import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
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
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

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

      const { data: authData, error } = await supabase.functions.invoke("auth", {
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

      // Store verification URL so user can verify directly in the modal
      if (authData?.verificationUrl) {
        setVerificationUrl(authData.verificationUrl);
        // Also attempt to send email in the background (non-blocking)
        fetch("/api/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, verificationUrl: authData.verificationUrl }),
        }).catch((e) => console.warn("[send-verification] non-critical:", e));
      }

      toaster.create({
        type: "success",
        title: existingEmail ? "Email updated — verify below" : "Email registered — verify below to claim rewards",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["user", address] });
    } catch (error) {
      console.error("Error signing up:", error);
      toaster.create({
        type: "error",
        title: `Error: ${error instanceof Error ? error.message : error}`,
      });
    }
  };

  const inviteLink = address
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${address}`
    : "";

  const shareText = "Join me on Zi Playground and earn ZI tokens!";

  const handleShare = (platform: "facebook" | "whatsapp" | "x") => {
    if (!inviteLink) return;
    const encodedLink = encodeURIComponent(inviteLink);
    const encodedText = encodeURIComponent(shareText);
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      x: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedLink}`,
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer");
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

          {/* Inline verification button — shown after email is saved */}
          {verificationUrl && (
            <Box w="90%" bg="orange.50" _dark={{ bg: "orange.900" }} rounded="lg" px={4} py={3}>
              <Text fontSize="sm" color="orange.700" _dark={{ color: "orange.200" }} mb={2} fontWeight="medium">
                One step left — verify your email:
              </Text>
              <Button
                w="full"
                size="sm"
                onClick={() => { window.open(verificationUrl, "_blank", "noopener,noreferrer"); }}
              >
                ✓ Click here to verify
              </Button>
              <Text fontSize="xs" color="orange.500" mt={2}>
                A verification email was also sent to your inbox.
              </Text>
            </Box>
          )}
          <Box
            w="90%"
            h="0.3rem"
            bg="linear-gradient(to bottom right, #a588e4, #b7fee0)"
            rounded="0.8rem"
          />
          <Text textAlign="center" fontWeight="medium">
            Share with friends
          </Text>
          <HStack spaceX={6} justify="center">
            <Box cursor="pointer" onClick={() => handleShare("facebook")}>
              <SocialIcon network="facebook" url="" />
            </Box>
            <Box cursor="pointer" onClick={() => handleShare("whatsapp")}>
              <SocialIcon network="whatsapp" url="" />
            </Box>
            <Box cursor="pointer" onClick={() => handleShare("x")}>
              <SocialIcon network="x" url="" />
            </Box>
          </HStack>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default EmailRegistrationModal;
