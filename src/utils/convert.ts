import BigNumber from "bignumber.js";

import { TxResponse } from "@soroban-react/contracts";
import { nativeToScVal, scValToBigInt, xdr } from "@stellar/stellar-sdk";

export function accountToScVal(account: string): xdr.ScVal {
  return nativeToScVal(account, { type: "address" });
}

export function scValToNumber(scVal: xdr.ScVal | TxResponse) {
  return Number(scValToBigInt(scVal as any));
}

export function formatBalance(
  balance: bigint | undefined | null,
  decimals: bigint | number | undefined | null
) {
  if (!balance || !decimals) return "0";

  return BigNumber(balance)
    .div(Math.pow(10, Number(decimals)))
    .toString();
}
