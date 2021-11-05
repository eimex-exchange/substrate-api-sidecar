import { blake2AsHex } from '@polkadot/util-crypto';
import type { HexString } from '@polkadot/util/types';

export interface Signature {
    type: "ed25519" | "sr25519" | "ecdsa";
    value: string;
}
export interface SignedPayload extends Signature {
    session: string;
}

export function serialize(...value: any): string {
    return blake2AsHex(JSON.stringify(value).replace('"', ''));
}

export function encode(signature: Signature): HexString {
    const type: string = signature.type.toLowerCase(); // default to sr25519
    const payload: string = signature.value.startsWith("0x") ?
        signature.value.substring(2) :
        signature.value;

    if (type == "ed25519") {
        return `0x00${payload}` as HexString;
    } else if (type == "sr25519") {
        return `0x01${payload}` as HexString;
    } else if (type == "ecdsa") {
        return `0x01${payload}` as HexString;
    }
    return `0x01${payload}` as HexString; // wtf .. assume sr25519
}