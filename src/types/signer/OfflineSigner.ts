import type { Signer, SignerResult } from '@polkadot/api/types';
import type { SignerPayloadRaw } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';
import { blake2AsHex } from '@polkadot/util-crypto';
import { Signature, encode } from './Signature';

const BLANK_SIGNATURE: HexString = '0x0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export class OfflineSigner implements Signer {
	private result: SignerResult;
	private signature?: Signature;

	constructor(signature?: Signature) {
		this.signRaw = this.signRaw.bind(this);
		this.signature = signature;
		this.result = {
			signature: BLANK_SIGNATURE,
			id: 0,
		}
	}

	public unsignedPayload(): string {
		return this.result.signature;
	}

	public unsignedResult(): SignerResult {
		return this.result;
	}

	public signRaw({ data }: SignerPayloadRaw): Promise<SignerResult> {
		return new Promise((resolve): void => {
			if (this.signature) {
				resolve({
					signature: encode(this.signature), // wtf? assume sr25519
					id: 0
				});
			} else {
				const hashed: HexString = (data.length > (256 + 1) * 2)
					? blake2AsHex(data)
					: BLANK_SIGNATURE;

				this.result = {
					signature: hashed,
					id: 0
				}
				resolve({
					signature: BLANK_SIGNATURE,
					id: -1
				});
			}
		});
	}
}

export default OfflineSigner;