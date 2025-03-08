import { TxResponse } from "@soroban-react/contracts";
import { nativeToScVal, scValToBigInt, xdr } from "@stellar/stellar-sdk";

export function accountToScVal(account: string): xdr.ScVal {
  return nativeToScVal(account, { type: "address" });
}

export function scValToNumber(scVal: xdr.ScVal | TxResponse) {
  return Number(scValToBigInt(scVal as any));
}
