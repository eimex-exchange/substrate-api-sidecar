import type { SignerOptions, } from '@polkadot/api/submittable/types';
import { ApiPromise } from '@polkadot/api';
import {
    IComposeResult,
    ComposePhase
} from '../../types/responses';
import {
    OfflineSigner,
    serialize,
    SignedPayload
} from '../../types/signer';
import { AbstractService } from '../AbstractService';
import { extractCauseAndStack } from './extractCauseAndStack';

interface TransactionComposeSession {
    options: Partial<SignerOptions>
    expiryTime: number; // what time in ms is this to be cleared
}

interface TransactionComposeCache {
    [key: string]: TransactionComposeSession;
}

export class TransactionComposeService extends AbstractService {

    private sessions: TransactionComposeCache;

    constructor(api: ApiPromise) {
        super(api);
        this.sessions = {};
    }

    async createTransaction(
        account: string,
        target: string,
        params: string[],
        signature: SignedPayload,
    ): Promise<IComposeResult> {
        const { api, sessions } = this;

        try {
            const [section, method] = target.split('.');
            const signer: OfflineSigner = new OfflineSigner(signature);
            const signerOptions: Partial<SignerOptions> = sessions[signature.session] ? sessions[signature.session].options : {};
            const transaction: any = api.tx[section][method](...params);

            await transaction.signAsync(account, {
                ...signerOptions,
                signer
            });

            delete sessions[signature.session]; // its been done

            return {
                phase: ComposePhase.TransactionReady,
                tx: transaction.toHex(),
            }
        } catch (err) {
            const { cause, stack } = extractCauseAndStack(err);

            throw {
                error: 'Unable to create transaction',
                cause,
                stack,
            };
        }
    }

    async createUnsignedPayload(
        account: string,
        target: string,
        params: string[],
    ): Promise<IComposeResult> {
        const { api, sessions } = this;

        try {
            const [section, method] = target.split('.');
            const signer: OfflineSigner = new OfflineSigner();
            const signedBlock = await api.rpc.chain.getBlock();
            const signerOptions: Partial<SignerOptions> = {
                signer: signer,
                blockHash: signedBlock.block.header.hash,
                nonce: (await api.derive.balances.account(account)).accountNonce,
                era: api.createType('ExtrinsicEra', {
                    current: signedBlock.block.header.number,
                    period: 50
                }),
            }

            const transaction: any = api.tx[section][method](...params);

            await transaction.signAsync(account, signerOptions);

            const currentTime: number = new Date().getTime();
            const currentKey: string = serialize(
                currentTime,
                account,
                target,
                params,
                signerOptions.blockHash,
                signerOptions.era,
                signerOptions.nonce,
                signerOptions.tip);

            for (const sessionKey in sessions) {
                if (sessions.hasOwnProperty(sessionKey)) {
                    if (sessions[sessionKey].expiryTime < currentTime) {
                        delete sessions[sessionKey]; // do a lazy clear of the cache
                    }
                }
            }

            sessions[currentKey] = {
                options: signerOptions,
                expiryTime: currentTime + (24 * 60 * 60 * 1000) // 1 day
            }

            return {
                phase: ComposePhase.SignatureRequired,
                payload: {
                    unsigned: signer.unsignedPayload(),
                    session: currentKey // we want to reference later..
                }
            }
        } catch (err) {
            const { cause, stack } = extractCauseAndStack(err);

            throw {
                error: 'Unable to sign request',
                cause,
                stack,
            };
        }
    }
}




