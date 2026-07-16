import { TrunkResourceManager } from "./trunks";
import { HttpResourceManager } from "../http";


export class SipResourceManager {
    public readonly trunks: TrunkResourceManager;

    constructor(http: HttpResourceManager) {
        this.trunks = new TrunkResourceManager(http);
    }
}