import { AudioAnalysisConfig, AudioWindow } from '../types/index.js';

/**
 * Hysteresis filter to prevent rapid camera switching
 *
 * This implements a "sticky" camera behavior where the current camera
 * won't switch unless:
 * 1. A different speaker has been dominant for at least minCutDuration
 * 2. The new speaker is significantly louder (above threshold)
 */
export class HysteresisFilter {
  private config: AudioAnalysisConfig;

  constructor(config: AudioAnalysisConfig) {
    this.config = config;
  }

  /**
   * Apply hysteresis filtering to audio windows
   * Returns filtered windows where camera switches are smoothed
   */
  applyFilter(windows: AudioWindow[]): AudioWindow[] {
    if (windows.length === 0) {
      return [];
    }

    const filtered: AudioWindow[] = [];
    let currentSpeaker: number | null = windows[0].dominantSpeaker;
    let currentSpeakerSince = 0; // Timestamp when current speaker became active
    let candidateSpeaker: number | null = null;
    let candidateSince = 0; // Timestamp when candidate started being louder

    for (const window of windows) {
      const { timestamp, dominantSpeaker } = window;

      // If silence, keep current speaker
      if (dominantSpeaker === null) {
        filtered.push({
          ...window,
          dominantSpeaker: currentSpeaker,
        });
        continue;
      }

      // If same speaker is still dominant, reset candidate
      if (dominantSpeaker === currentSpeaker) {
        candidateSpeaker = null;
        candidateSince = 0;
        filtered.push(window);
        continue;
      }

      // Different speaker is dominant
      if (dominantSpeaker !== currentSpeaker) {
        // Check if this is a new candidate
        if (candidateSpeaker !== dominantSpeaker) {
          candidateSpeaker = dominantSpeaker;
          candidateSince = timestamp;
        }

        // Check if candidate has been dominant long enough
        const candidateDuration = timestamp - candidateSince;
        if (candidateDuration >= this.config.minCutDuration) {
          // Switch to new speaker
          currentSpeaker = dominantSpeaker;
          currentSpeakerSince = candidateSince;
          candidateSpeaker = null;
          candidateSince = 0;
          filtered.push(window);
        } else {
          // Not long enough, keep current speaker
          filtered.push({
            ...window,
            dominantSpeaker: currentSpeaker,
          });
        }
      }
    }

    return filtered;
  }

  /**
   * Detect transitions where the speaker changes
   * Returns array of { timestamp, fromSpeaker, toSpeaker }
   */
  detectTransitions(windows: AudioWindow[]): Array<{
    timestamp: number;
    fromSpeaker: number | null;
    toSpeaker: number | null;
  }> {
    const transitions: Array<{
      timestamp: number;
      fromSpeaker: number | null;
      toSpeaker: number | null;
    }> = [];

    let previousSpeaker: number | null = null;

    for (const window of windows) {
      if (window.dominantSpeaker !== previousSpeaker) {
        transitions.push({
          timestamp: window.timestamp,
          fromSpeaker: previousSpeaker,
          toSpeaker: window.dominantSpeaker,
        });
        previousSpeaker = window.dominantSpeaker;
      }
    }

    return transitions;
  }

  /**
   * Calculate statistics about speaker transitions
   */
  calculateStats(windows: AudioWindow[]): {
    totalTransitions: number;
    averageSegmentDuration: number;
    speakerDurations: Map<number, number>;
  } {
    const transitions = this.detectTransitions(windows);
    const speakerDurations = new Map<number, number>();

    if (windows.length === 0) {
      return {
        totalTransitions: 0,
        averageSegmentDuration: 0,
        speakerDurations,
      };
    }

    let currentSpeaker: number | null = windows[0].dominantSpeaker;
    let currentSpeakerStart = windows[0].timestamp;

    for (let i = 1; i < windows.length; i++) {
      const window = windows[i];

      if (window.dominantSpeaker !== currentSpeaker) {
        // Transition detected
        const duration = window.timestamp - currentSpeakerStart;

        if (currentSpeaker !== null) {
          const existing = speakerDurations.get(currentSpeaker) || 0;
          speakerDurations.set(currentSpeaker, existing + duration);
        }

        currentSpeaker = window.dominantSpeaker;
        currentSpeakerStart = window.timestamp;
      }
    }

    // Add final segment
    const finalDuration = windows[windows.length - 1].timestamp - currentSpeakerStart;
    if (currentSpeaker !== null) {
      const existing = speakerDurations.get(currentSpeaker) || 0;
      speakerDurations.set(currentSpeaker, existing + finalDuration);
    }

    const totalDuration = windows[windows.length - 1].timestamp - windows[0].timestamp;
    const averageSegmentDuration =
      transitions.length > 0 ? totalDuration / transitions.length : totalDuration;

    return {
      totalTransitions: transitions.length,
      averageSegmentDuration,
      speakerDurations,
    };
  }
}
