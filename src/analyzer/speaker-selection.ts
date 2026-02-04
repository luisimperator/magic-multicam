import {
  AudioAnalysisConfig,
  AudioWindow,
  CutDecision,
  LayoutConfig,
  MultiShotFrequency,
} from '../types/index.js';
import { HysteresisFilter } from './hysteresis.js';

/**
 * Speaker selector that decides which camera to use based on audio analysis
 */
export class SpeakerSelector {
  private config: AudioAnalysisConfig;
  private layout: LayoutConfig;
  private hysteresisFilter: HysteresisFilter;

  constructor(config: AudioAnalysisConfig, layout: LayoutConfig) {
    this.config = config;
    this.layout = layout;
    this.hysteresisFilter = new HysteresisFilter(config);
  }

  /**
   * Generate cut decisions from audio windows
   */
  generateCuts(windows: AudioWindow[]): CutDecision[] {
    // Apply hysteresis filter first
    const filteredWindows = this.hysteresisFilter.applyFilter(windows);

    const cuts: CutDecision[] = [];
    let previousCamera: number | null = null;

    for (const window of filteredWindows) {
      const decision = this.selectCamera(window);

      // Only create a cut decision if camera changes
      if (decision.cameraIndex !== previousCamera) {
        cuts.push(decision);
        previousCamera = decision.cameraIndex;
      }
    }

    return cuts;
  }

  /**
   * Select which camera to use for a given audio window
   */
  private selectCamera(window: AudioWindow): CutDecision {
    const { timestamp, rmsLevels, dominantSpeaker } = window;

    // Determine which speakers are active (above threshold)
    const activeSpeakers: number[] = [];
    rmsLevels.forEach((level, index) => {
      if (level > this.config.activeSpeakerThreshold) {
        activeSpeakers.push(index);
      }
    });

    // Determine if we should use multi-shot (wide shot)
    const shouldUseMultiShot = this.shouldUseMultiShot(activeSpeakers);

    let cameraIndex: number;
    let reason: CutDecision['reason'];

    if (shouldUseMultiShot && this.layout.wideShot?.enabled) {
      // Use wide shot camera
      cameraIndex = this.layout.wideShot.cameraIndex;
      reason = 'multi_speaker';
    } else if (dominantSpeaker !== null) {
      // Use the camera for the dominant speaker
      const speaker = this.layout.speakers.find((s) => s.speakerName === String(dominantSpeaker));
      cameraIndex = speaker ? speaker.cameraIndex : 0;
      reason = 'speaker_change';
    } else {
      // Silence - use wide shot if available, otherwise camera 0
      cameraIndex = this.layout.wideShot?.enabled ? this.layout.wideShot.cameraIndex : 0;
      reason = 'silence';
    }

    return {
      timestamp,
      timecode: this.formatTimecode(timestamp),
      cameraIndex,
      reason,
      activeSpeakers,
      audioLevels: rmsLevels,
    };
  }

  /**
   * Determine if multi-shot (wide shot) should be used based on:
   * 1. Number of active speakers
   * 2. Multi-shot frequency setting
   */
  private shouldUseMultiShot(activeSpeakers: number[]): boolean {
    const numActive = activeSpeakers.length;

    // If multiple speakers are active
    if (numActive >= this.config.multiSpeakerThreshold) {
      // Decide based on frequency setting
      switch (this.layout.multiShotFrequency) {
        case 'high':
          // Use multi-shot whenever 2+ speakers are active
          return true;

        case 'medium':
          // Use multi-shot when 3+ speakers are active, or randomly for 2 speakers
          if (numActive >= 3) return true;
          if (numActive === 2) return Math.random() > 0.5;
          return false;

        case 'low':
          // Only use multi-shot when 3+ speakers are very active
          return numActive >= 3;

        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Format timestamp as Premiere Pro timecode (HH:MM:SS:FF)
   * Assumes 24fps for now - should be configurable
   */
  private formatTimecode(seconds: number, fps: number = 24): string {
    const totalFrames = Math.floor(seconds * fps);
    const frames = totalFrames % fps;
    const totalSeconds = Math.floor(totalFrames / fps);
    const secs = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const mins = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }

  /**
   * Calculate statistics about the cuts
   */
  calculateStats(
    cuts: CutDecision[],
    duration: number
  ): {
    totalCuts: number;
    averageCutDuration: number;
    speakerTalkTime: Record<number, number>;
    multiShotUsage: number;
  } {
    const stats = this.hysteresisFilter.calculateStats(
      cuts.map((cut) => ({
        timestamp: cut.timestamp,
        duration: 0, // Not used in stats calculation
        rmsLevels: cut.audioLevels,
        dominantSpeaker:
          cut.reason === 'multi_speaker'
            ? null
            : cut.activeSpeakers.length > 0
              ? cut.activeSpeakers[0]
              : null,
      }))
    );

    // Calculate multi-shot usage
    let multiShotDuration = 0;
    const wideShotIndex = this.layout.wideShot?.cameraIndex ?? -1;

    for (let i = 0; i < cuts.length - 1; i++) {
      const cut = cuts[i];
      const nextCut = cuts[i + 1];
      const segmentDuration = nextCut.timestamp - cut.timestamp;

      if (cut.cameraIndex === wideShotIndex) {
        multiShotDuration += segmentDuration;
      }
    }

    // Add final segment
    if (cuts.length > 0) {
      const lastCut = cuts[cuts.length - 1];
      const finalDuration = duration - lastCut.timestamp;
      if (lastCut.cameraIndex === wideShotIndex) {
        multiShotDuration += finalDuration;
      }
    }

    const multiShotUsage = duration > 0 ? (multiShotDuration / duration) * 100 : 0;

    // Convert speaker durations Map to Record
    const speakerTalkTime: Record<number, number> = {};
    stats.speakerDurations.forEach((duration, speaker) => {
      speakerTalkTime[speaker] = duration;
    });

    return {
      totalCuts: stats.totalTransitions,
      averageCutDuration: stats.averageSegmentDuration,
      speakerTalkTime,
      multiShotUsage,
    };
  }
}
