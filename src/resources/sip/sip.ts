import { TrunkResourceManager } from "./trunks";
import { HttpResourceManager } from "../http";
import { SipCallResourceManager } from "./calls";


export class SipResourceManager {
    public readonly trunks: TrunkResourceManager;
    public readonly calls:  SipCallResourceManager;

    constructor(http: HttpResourceManager) {
        this.trunks = new TrunkResourceManager(http);
        this.calls  = new SipCallResourceManager(http);
    }
}