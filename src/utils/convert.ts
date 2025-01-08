import { Address, xdr } from '@stellar/stellar-sdk';

export function accountToScVal(account: string): xdr.ScVal {
    return new Address(account).toScVal();
}
