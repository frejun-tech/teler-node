import { HttpResourceManager } from "../http";
import { AppResourceManager } from "./apps";
import { CallResourceManager } from "./calls";
import { ControlResourceManager } from "./controls";
import { OperationResourceManager } from "./operations";

export class VoiceResourceManager {
    public readonly apps: AppResourceManager;
    public readonly calls: CallResourceManager;
    public readonly controls: ControlResourceManager;
    public readonly operations: OperationResourceManager;

    constructor(http: HttpResourceManager) {
        this.apps  = new AppResourceManager(http);
        this.calls = new CallResourceManager(http);
        this.controls = new ControlResourceManager(http);
        this.operations = new OperationResourceManager(http);
    }
}