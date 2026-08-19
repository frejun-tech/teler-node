import { TrunkResourceManager } from "./trunks";
import { HttpResourceManager } from "../http";
import { SipCallResourceManager } from "./calls";
import { IpAclResourceManager } from "./ipAcls";

export class SipResourceManager {
  public readonly trunks: TrunkResourceManager;
  public readonly calls: SipCallResourceManager;
  public readonly ipAcls: IpAclResourceManager;

  constructor(http: HttpResourceManager) {
    this.trunks = new TrunkResourceManager(http);
    this.calls = new SipCallResourceManager(http);
    this.ipAcls = new IpAclResourceManager(http);
  }
}
