import Packet, { PacketDirection } from '../Packet';
import PacketType from '../PacketType';

export type SwapRequestPacketBody = {
  proposedQuantity: number;
  pairId: string;
  takerAmount: number;
  takerCurrency: string;
  makerAmount: number;
  makerCurrency: string;
  orderId: string;
  r_hash: string;
};

class SwapRequestPacket extends Packet<SwapRequestPacketBody> {
  public get type() {
    return PacketType.SWAP_REQUEST;
  }

  public get direction() {
    return PacketDirection.REQUEST;
  }
}

export default SwapRequestPacket;
