import P2PRepository from './P2PRepository';
import { NodeInstance, NodeFactory } from '../types/db';
import { Address, ReputationEvent } from '../types/p2p';
import addressUtils from '../utils/addressUtils';
import { ReputationEventType } from '../types/enums';
import { ms } from '../utils/utils';
import { EventEmitter } from 'events';

const ReputationEventWeight = {
  [ReputationEventType.ManualBan]: -100000000,
  [ReputationEventType.PacketTimeout]: -5,
  [ReputationEventType.SwapTimeout]: -15,
  [ReputationEventType.SwapSuccess]: 1,
};

// TODO: remove events after certain amount of time

interface NodeList {
  on(event: 'node.ban', listener: (nodePubKey: string, events: ReputationEvent[]) => void): this;
  emit(event: 'node.ban', nodePubKey: string, events: ReputationEvent[]): boolean;
}

/** Represents a list of nodes for managing network peers activity */
class NodeList extends EventEmitter {
  private banThreshold = -50;

  private nodes = new Map<string, NodeInstance>();

  public get count() {
    return this.nodes.size;
  }

  constructor(private repository: P2PRepository) {
    super();
  }

  /**
   * Check if a node with a given nodePubKey exists.
   */
  public has = (nodePubKey: string) => {
    return this.nodes.has(nodePubKey);
  }

  public forEach = (callback: (node: NodeInstance) => void) => {
    this.nodes.forEach(callback);
  }

  /**
   * Ban a node by nodePubKey.
   * @returns true if the node was banned, false otherwise
   */
  public ban = async (nodePubKey: string): Promise<boolean> => {
    return this.addReputationEvent(nodePubKey, ReputationEventType.ManualBan);
  }

  public isBanned = (nodePubKey: string): boolean => {
    const node = this.nodes.get(nodePubKey);
    return node ? this.nodeIsBanned(node) : false;
  }

  /**
   * Load this NodeList from the database.
   */
  public load = async (): Promise<void> => {
    const nodes = await this.repository.getNodes();

    nodes.forEach((node) => {
      node.reputationScore = this.calculateReputationScore(node.reputationEvents);
      this.nodes.set(node.nodePubKey, node);
    });
  }

  /**
   * Create a Node in the database.
   */
  public createNode = async (nodeFactory: NodeFactory): Promise<NodeInstance> => {
    const node = await this.repository.addNode(nodeFactory);
    this.nodes.set(node.nodePubKey, node);
    return node;
  }

  /**
   * Update a node's addresses.
   * @return true if the specified node exists and was updated, false otherwise
   */
  public updateAddresses = async (nodePubKey: string, addresses: Address[] = []) => {
    const node = this.nodes.get(nodePubKey);
    if (node) {
      // avoid overriding the `lastConnected` field for existing matching addresses unless a new value was set
      node.addresses = addresses.map((newAddress) => {
        const oldAddress = node.addresses.find(address => addressUtils.areEqual(address, newAddress));
        if (oldAddress && !newAddress.lastConnected) {
          return oldAddress;
        } else {
          return newAddress;
        }
      });

      await node.save();
      return true;
    }

    return false;
  }

  /**
   * Add a reputation event to the nodes history
   * @return true if the node was banned, false otherwise
   */
  public addReputationEvent = async (nodePubKey: string, type: ReputationEventType) => {
    const node = this.nodes.get(nodePubKey);
    if (node) {
      node.reputationScore += ReputationEventWeight[type];

      if (this.nodeIsBanned(node)) {
        this.emit('node.ban', nodePubKey, node.reputationEvents);
      }

      node.reputationEvents = [...node.reputationEvents, { type, date: ms() }];
      await node.save();

      return true;
    }

    return false;
  }

  public removeAddress = async (nodePubKey: string, address: Address) => {
    const node = this.nodes.get(nodePubKey);
    if (node) {
      const index = node.addresses.findIndex(existingAddress => addressUtils.areEqual(address, existingAddress));
      if (index > -1) {
        node.addresses = [...node.addresses.slice(0, index), ...node.addresses.slice(index + 1)];
        await node.save();
        return true;
      }
    }

    return false;
  }

  private calculateReputationScore = (reputationEvents: ReputationEvent[]): number => {
    let score = 0;

    reputationEvents.forEach((occurrence) => {
      score += ReputationEventWeight[occurrence.type];
    });

    return score;
  }

  private nodeIsBanned = (node: NodeInstance) => {
    return node.reputationScore < this.banThreshold;
  }
}

export default NodeList;
