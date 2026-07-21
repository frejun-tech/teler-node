import type { RecordingParams } from "../types/core";
import type { HttpResourceManager } from "./http";
import type { Readable } from "node:stream";


export class RecordingResourceManager {
    private readonly basePath = '/recordings';
    constructor(private readonly http: HttpResourceManager){}
    
    
    /**
     * Fetch recording.
     * @param params - The recording parameters including recording_id and optional expires_in duration.
     * @returns Redirect to the recording.
     */
    public async retrieve(params: RecordingParams): Promise<Readable> {
        return this.http.get<Readable>(this.basePath, params);
    }
}