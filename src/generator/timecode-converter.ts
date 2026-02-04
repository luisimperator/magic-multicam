import { SequenceConfig } from '../types/index.js';

/**
 * Timecode converter for Premiere Pro
 * Handles conversion between seconds and Premiere's ticks system
 */
export class TimecodeConverter {
  private config: SequenceConfig;
  private ticksPerSecond: number;

  constructor(config: SequenceConfig) {
    this.config = config;
    // Premiere Pro uses 254016000000 ticks per second
    this.ticksPerSecond = 254016000000;
  }

  /**
   * Convert seconds to Premiere ticks
   */
  secondsToTicks(seconds: number): string {
    const ticks = Math.round(seconds * this.ticksPerSecond);
    return ticks.toString();
  }

  /**
   * Convert timecode string (HH:MM:SS:FF) to ticks
   */
  timecodeToTicks(timecode: string): string {
    const seconds = this.timecodeToSeconds(timecode);
    return this.secondsToTicks(seconds);
  }

  /**
   * Convert timecode string to seconds
   */
  timecodeToSeconds(timecode: string): number {
    const parts = timecode.split(':');
    if (parts.length !== 4) {
      throw new Error(`Invalid timecode format: ${timecode}. Expected HH:MM:SS:FF`);
    }

    const [hours, minutes, seconds, frames] = parts.map(Number);
    const totalSeconds =
      hours * 3600 + minutes * 60 + seconds + frames / this.config.frameRate;

    return totalSeconds;
  }

  /**
   * Convert seconds to timecode string (HH:MM:SS:FF)
   */
  secondsToTimecode(seconds: number): string {
    const totalFrames = Math.floor(seconds * this.config.frameRate);
    const frames = totalFrames % this.config.frameRate;
    const totalSeconds = Math.floor(totalFrames / this.config.frameRate);
    const secs = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const mins = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }

  /**
   * Parse the sequence start timecode and return offset in seconds
   */
  getStartOffset(): number {
    return this.timecodeToSeconds(this.config.timecodeStart);
  }
}
