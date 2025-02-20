import { TxResponse } from '@soroban-react/contracts';
import { Address, scValToBigInt, xdr } from '@stellar/stellar-sdk';

export function accountToScVal(account: string): xdr.ScVal {
    return new Address(account).toScVal();
}

export function scValToNumber(scVal: xdr.ScVal | TxResponse) {
    return Number(scValToBigInt(scVal as any));
}