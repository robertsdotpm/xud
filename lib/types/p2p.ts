import { ReputationEventType } from './enums';

export type Address = {
  host: string;
  port: number;
  /** Epoch timestamp of last successful connection with this address */
  lastConnected?: number;
};

/** Information used for connecting to a remote node. */
export type NodeConnectionInfo = {
  nodePubKey: string;
  addresses: Address[];
};

export type HandshakeState = {
  version: string;
  nodePubKey: string;
  addresses?: Address[];
  pairs: string[];
  raidenAddress?: string;
  lndbtcPubKey?: string;
  lndltcPubKey?: string;
};

export type ReputationEvent = {
  type: ReputationEventType;
  date: number;
};
