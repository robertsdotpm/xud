import Packet, { PacketDirection } from '../Packet';
import PacketType from '../PacketType';
import { ReputationEvent } from '../../../types/p2p';

export type BanInformPacketBody = {
  events: ReputationEvent[];
};

class BanInformPacket extends Packet<BanInformPacketBody> {
  public get type() {
    return PacketType.BAN_INFORM;
  }

  public get direction() {
    return PacketDirection.UNILATERAL;
  }
}

export default BanInformPacket;
