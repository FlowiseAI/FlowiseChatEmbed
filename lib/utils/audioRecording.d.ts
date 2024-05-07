export declare function getElaspedTime(): string;
/** Starts the audio recording*/
export declare function startAudioRecording(onRecordingStart: (value: boolean) => void, onUnsupportedBrowser: (value: boolean) => void, setElapsedTime: (value: string) => void): void;
/** Stop the currently started audio recording & sends it
 */
export declare function stopAudioRecording(addRecordingToPreviews: null | ((blob: Blob) => void)): void;
/** Cancel the currently started audio recording */
export declare function cancelAudioRecording(): void;
type AudioRecorder = {
    audioBlobs: Blob[];
    mediaRecorder: MediaRecorder | null;
    streamBeingCaptured: MediaStream | null;
    start: () => Promise<void>;
    stop: () => Promise<unknown>;
    cancel: () => void;
    stopStream: () => void;
    resetRecordingProperties: () => void;
};
export declare const audioRecorder: AudioRecorder;
export {};
//# sourceMappingURL=audioRecording.d.ts.map