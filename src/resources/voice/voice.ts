import { HttpResourceManager } from "../http";
import { AppResourceManager } from "./apps";
import { CallResourceManager } from "./calls";
import { MutationResourceManager } from "./mutations";
import { OperationResourceManager } from "./operations";

export class VoiceResourceManager {
  public readonly apps: AppResourceManager;
  public readonly calls: CallResourceManager;
  public readonly mutations: MutationResourceManager;
  public readonly operations: OperationResourceManager;

  constructor(http: HttpResourceManager) {
    this.apps = new AppResourceManager(http);
    this.calls = new CallResourceManager(http);
    this.mutations = new MutationResourceManager(http);
    this.operations = new OperationResourceManager(http);
  }
}
