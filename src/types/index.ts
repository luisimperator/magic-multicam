/**
 * Multi-Shot Frequency determines how often to use the wide shot
 * when multiple speakers are active simultaneously
 */
export type MultiShotFrequency = 'low' | 'medium' | 'high';

/**
 * Cutting method for the editor
 */
export type CuttingMethod = 'automatic' | 'manual' | 'disabled';

/**
 * Speaker to camera mapping
 */
export interface SpeakerMapping {
  speakerName: string;      // e.g., "Parker", "Jon"
  audioTrackId: string;     // e.g., "A1", "A2"
  cameraIndex: number;      // e.g., 0, 1 (zero-based for Premiere)
  videoTrackId: string;     // e.g., "V1", "V2"
}

/**
 * Layout/Preset configuration
 */
export interface LayoutConfig {
  name: string;
  cuttingMethod: CuttingMethod;
  multiShotFrequency: MultiShotFrequency;
  speakerCount: number;
  cameraCount: number;
  speakers: SpeakerMapping[];
  wideShot?: {
    enabled: boolean;
    cameraIndex: number;    // Index of the wide shot camera
    videoTrackId: string;
  };
}

/**
 * Audio analysis configuration
 */
export interface AudioAnalysisConfig {
  // Sampling configuration
  sampleRate: number;           // e.g., 44100 Hz
  windowSize: number;           // Analysis window in milliseconds (e.g., 100ms)

  // Thresholds
  silenceThreshold: number;     // dB threshold for silence detection (e.g., -30dB)
  activeSpeakerThreshold: number; // dB threshold for active speaker (e.g., -20dB)

  // Hysteresis configuration
  minCutDuration: number;       // Minimum duration between cuts in seconds (e.g., 1.5s)

  // Multi-shot configuration
  multiSpeakerThreshold: number; // How many speakers must be active for multi-shot
}

/**
 * A single cut decision at a specific timestamp
 */
export interface CutDecision {
  timestamp: number;        // Time in seconds from start
  timecode: string;         // Premiere-formatted timecode (e.g., "00:01:23:15")
  cameraIndex: number;      // Which camera to switch to
  reason: 'speaker_change' | 'multi_speaker' | 'silence' | 'manual';
  activeSpeakers: number[]; // Indices of active speakers at this moment
  audioLevels: number[];    // dB levels for each speaker
}

/**
 * Result of audio analysis
 */
export interface AnalysisResult {
  duration: number;          // Total duration in seconds
  cuts: CutDecision[];       // All cut decisions
  stats: {
    totalCuts: number;
    averageCutDuration: number;
    speakerTalkTime: Record<number, number>; // Speaker index -> seconds
    multiShotUsage: number;  // Percentage of time using wide shot
  };
}

/**
 * Audio file input
 */
export interface AudioInput {
  filePath: string;
  speakerIndex: number;      // Maps to speaker in layout config
  trackId: string;           // e.g., "A1", "A2"
}

/**
 * Premiere Pro sequence configuration
 */
export interface SequenceConfig {
  name: string;
  frameRate: number;         // e.g., 23.976, 24, 29.97, 30, 60
  timecodeStart: string;     // Starting timecode (e.g., "00:00:00:00")
  videoTrackIndex: number;   // Which video track contains the multicam clip
  audioTrackIndices: number[]; // Which audio tracks to analyze
}

/**
 * ExtendScript generation options
 */
export interface JSXGenerationOptions {
  useQEAPI: boolean;         // Use Quality Engineering API (more powerful)
  addComments: boolean;      // Add explanatory comments to JSX
  optimizePerformance: boolean; // Batch operations when possible
  validateSequence: boolean; // Add validation checks
}

/**
 * Complete job configuration for processing
 */
export interface ProcessingJob {
  layout: LayoutConfig;
  audioInputs: AudioInput[];
  audioConfig: AudioAnalysisConfig;
  sequenceConfig: SequenceConfig;
  jsxOptions: JSXGenerationOptions;
  outputPath: string;        // Where to save the generated .jsx file
}

/**
 * Audio analysis window result
 */
export interface AudioWindow {
  timestamp: number;         // Start time in seconds
  duration: number;          // Window duration in seconds
  rmsLevels: number[];       // RMS levels in dB for each speaker
  dominantSpeaker: number | null; // Index of loudest speaker, or null if silence
}
