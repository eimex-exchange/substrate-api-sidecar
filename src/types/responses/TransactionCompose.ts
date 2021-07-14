

export enum ComposePhase {
	SignatureRequired = 'SignatureRequired',
	TransactionReady = 'TransactionReady',
}

export interface UnsignedPayload {
	unsigned: string;
	session: string;
}

export interface IComposeResult {
	phase: ComposePhase;
	payload?: UnsignedPayload;
	tx?: string;
}
