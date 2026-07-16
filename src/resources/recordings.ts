import { RecordingParams } from "../types/core";
import { HttpResourceManager } from "./http";
import { Readable } from "node:stream";


export class RecordingResourceManager {
    private readonly basePath = '/recordings';
    constructor(private readonly http: HttpResourceManager){}
    
    
    /**
     * Fetch recording.
     * @param recordingId, expiresIn - The recording to fetch and signedURL expires in duration.
     * @returns Redirect to the recording.
     */
    public async retrieve(params: RecordingParams): Promise<Readable> {
        return this.http.get<Readable>(this.basePath, params);
    }
}