import { HttpResourceManager } from "../http";
import { AppResourceManager } from "./apps";
import { CallResourceManager } from "./calls";

export class VoiceResourceManager {
    public readonly apps: AppResourceManager;
    public readonly calls: CallResourceManager;

    constructor(http: HttpResourceManager) {
        this.apps  = new AppResourceManager(http);
        this.calls = new CallResourceManager(http);
    }
}