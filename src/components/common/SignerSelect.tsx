import { Signer } from "passkey-kit";
import { useContext, useMemo } from "react";

import { Menu } from "@chakra-ui/react";

import { AppContext } from "@/providers";
import { truncateAddress } from "@/utils";
import Button from "../Button";
import { useColorModeValue } from "../ui/color-mode";

const SignerSelect = () => {
  const { signers } = useContext(AppContext);

  const ed25519Signers = useMemo(
    () => signers
      .filter(signer => signer.kind == 'Ed25519')
      .reduce((prev, signer) => prev.some(s => s.key == signer.key) ? prev : [...prev, signer], [] as Signer[]),
    [signers]
  );

  if (ed25519Signers.length == 0)
    return <></>

  return (
    <Menu.Root>
      <Menu.Trigger as={Button}>
        Please select a signer
      </Menu.Trigger>
      <Menu.Positioner zIndex={2001}>
        <Menu.Content
          py={2}
          bg={useColorModeValue(
            "linear-gradient(#F8F8F8, #F8F8F8) padding-box, linear-gradient(to bottom right, #a588e4, #b7fee0) border-box;",
            "linear-gradient(#13141E, #13141E) padding-box, linear-gradient(to bottom right, #a588e4, #b7fee0) border-box;"
          )}
          border="2px solid transparent"
          rounded="xl"
        >
          {ed25519Signers.map((signer, index) => (
            <Menu.Item
              p="8px 16px"
              key={index}
              value={signer.key}
            >
              {truncateAddress(signer.key)}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}

export default SignerSelect;
