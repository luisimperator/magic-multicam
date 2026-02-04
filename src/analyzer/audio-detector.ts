import fs from 'fs';
import path from 'path';
import { AudioInput, AudioAnalysisConfig, AudioWindow } from '../types/index.js';

/**
 * Decodes a WAV file and returns audio samples
 * Note: This is a simplified implementation. For production, consider using
 * libraries like node-wav or audio-decode
 */
export class WavDecoder {
  /**
   * Read WAV file and extract PCM samples
   */
  static decode(filePath: string): { samples: Float32Array; sampleRate: number } {
    const buffer = fs.readFileSync(filePath);

    // Simple WAV header parsing
    // Assumes 16-bit PCM mono WAV file for simplicity
    const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    // Verify RIFF header
    const riff = String.fromCharCode(...Array.from(buffer.subarray(0, 4)));
    if (riff !== 'RIFF') {
      throw new Error(`Invalid WAV file: ${filePath} (missing RIFF header)`);
    }

    // Verify WAVE format
    const wave = String.fromCharCode(...Array.from(buffer.subarray(8, 12)));
    if (wave !== 'WAVE') {
      throw new Error(`Invalid WAV file: ${filePath} (missing WAVE format)`);
    }

    // Find fmt chunk
    let offset = 12;
    let fmtChunkSize = 0;
    let sampleRate = 0;
    let bitsPerSample = 0;
    let numChannels = 0;

    while (offset < buffer.length) {
      const chunkId = String.fromCharCode(...Array.from(buffer.subarray(offset, offset + 4)));
      const chunkSize = dataView.getUint32(offset + 4, true);

      if (chunkId === 'fmt ') {
        // Parse format chunk
        // const audioFormat = dataView.getUint16(offset + 8, true); // 1 = PCM
        numChannels = dataView.getUint16(offset + 10, true);
        sampleRate = dataView.getUint32(offset + 12, true);
        bitsPerSample = dataView.getUint16(offset + 22, true);
        fmtChunkSize = chunkSize;
        offset += 8 + chunkSize;
      } else if (chunkId === 'data') {
        // Parse data chunk
        const dataSize = chunkSize;
        const dataOffset = offset + 8;

        // Convert PCM samples to Float32Array (-1.0 to 1.0)
        const bytesPerSample = bitsPerSample / 8;
        const numSamples = Math.floor(dataSize / bytesPerSample / numChannels);
        const samples = new Float32Array(numSamples);

        for (let i = 0; i < numSamples; i++) {
          let sample = 0;

          if (bitsPerSample === 16) {
            // 16-bit signed integer
            const sampleOffset = dataOffset + i * bytesPerSample * numChannels;
            sample = dataView.getInt16(sampleOffset, true) / 32768.0;
          } else if (bitsPerSample === 8) {
            // 8-bit unsigned integer
            const sampleOffset = dataOffset + i * bytesPerSample * numChannels;
            sample = (dataView.getUint8(sampleOffset) - 128) / 128.0;
          } else if (bitsPerSample === 24) {
            // 24-bit signed integer
            const sampleOffset = dataOffset + i * bytesPerSample * numChannels;
            const byte1 = dataView.getUint8(sampleOffset);
            const byte2 = dataView.getUint8(sampleOffset + 1);
            const byte3 = dataView.getInt8(sampleOffset + 2);
            sample = ((byte3 << 16) | (byte2 << 8) | byte1) / 8388608.0;
          } else if (bitsPerSample === 32) {
            // 32-bit float
            const sampleOffset = dataOffset + i * bytesPerSample * numChannels;
            sample = dataView.getFloat32(sampleOffset, true);
          }

          samples[i] = sample;
        }

        return { samples, sampleRate };
      } else {
        // Skip unknown chunk
        offset += 8 + chunkSize;
      }
    }

    throw new Error(`No data chunk found in WAV file: ${filePath}`);
  }
}

/**
 * Audio detector that analyzes audio levels in windows
 */
export class AudioDetector {
  private config: AudioAnalysisConfig;

  constructor(config: AudioAnalysisConfig) {
    this.config = config;
  }

  /**
   * Analyze multiple audio files and return windows with RMS levels
   */
  async analyze(audioInputs: AudioInput[]): Promise<AudioWindow[]> {
    // Decode all audio files
    const decodedAudios = audioInputs.map((input) => {
      const { samples, sampleRate } = WavDecoder.decode(input.filePath);
      return {
        speakerIndex: input.speakerIndex,
        samples,
        sampleRate,
        trackId: input.trackId,
      };
    });

    // Verify all files have the same sample rate
    const firstSampleRate = decodedAudios[0].sampleRate;
    const allSameRate = decodedAudios.every((audio) => audio.sampleRate === firstSampleRate);
    if (!allSameRate) {
      throw new Error('All audio files must have the same sample rate');
    }

    // Calculate the maximum duration
    const maxSamples = Math.max(...decodedAudios.map((a) => a.samples.length));
    const durationSeconds = maxSamples / firstSampleRate;

    // Calculate window parameters
    const windowSizeSamples = Math.floor((this.config.windowSize / 1000) * firstSampleRate);
    const numWindows = Math.ceil(maxSamples / windowSizeSamples);

    const windows: AudioWindow[] = [];

    // Process each window
    for (let i = 0; i < numWindows; i++) {
      const startSample = i * windowSizeSamples;
      const endSample = Math.min(startSample + windowSizeSamples, maxSamples);
      const timestamp = startSample / firstSampleRate;
      const duration = (endSample - startSample) / firstSampleRate;

      // Calculate RMS for each speaker in this window
      const rmsLevels: number[] = [];
      let dominantSpeaker: number | null = null;
      let maxRMS = -Infinity;

      for (const audio of decodedAudios) {
        const rmsDB = this.calculateRMS(audio.samples, startSample, endSample);
        rmsLevels[audio.speakerIndex] = rmsDB;

        // Track dominant speaker
        if (rmsDB > this.config.activeSpeakerThreshold && rmsDB > maxRMS) {
          maxRMS = rmsDB;
          dominantSpeaker = audio.speakerIndex;
        }
      }

      windows.push({
        timestamp,
        duration,
        rmsLevels,
        dominantSpeaker,
      });
    }

    return windows;
  }

  /**
   * Calculate RMS (Root Mean Square) level in decibels
   */
  private calculateRMS(samples: Float32Array, startSample: number, endSample: number): number {
    let sumSquares = 0;
    let count = 0;

    for (let i = startSample; i < endSample && i < samples.length; i++) {
      sumSquares += samples[i] * samples[i];
      count++;
    }

    if (count === 0) {
      return -Infinity; // Silence
    }

    const rms = Math.sqrt(sumSquares / count);

    // Convert to decibels (reference: 1.0 = 0 dB)
    if (rms === 0) {
      return -Infinity;
    }

    return 20 * Math.log10(rms);
  }
}
