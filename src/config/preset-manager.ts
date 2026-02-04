import fs from 'fs';
import path from 'path';
import os from 'os';
import { LayoutConfig, AudioAnalysisConfig } from '../types/index.js';

/**
 * Manages saving and loading of layout presets
 */
export class PresetManager {
  private presetsDir: string;

  constructor(customPresetsDir?: string) {
    // Default to ~/.magic-multicam/presets
    this.presetsDir =
      customPresetsDir || path.join(os.homedir(), '.magic-multicam', 'presets');

    // Ensure presets directory exists
    this.ensurePresetsDir();
  }

  /**
   * Ensure the presets directory exists
   */
  private ensurePresetsDir(): void {
    if (!fs.existsSync(this.presetsDir)) {
      fs.mkdirSync(this.presetsDir, { recursive: true });
    }
  }

  /**
   * Save a layout preset
   */
  savePreset(preset: LayoutConfig): void {
    const filename = this.sanitizeFilename(preset.name) + '.json';
    const filepath = path.join(this.presetsDir, filename);

    const data = JSON.stringify(preset, null, 2);
    fs.writeFileSync(filepath, data, 'utf8');
  }

  /**
   * Load a layout preset by name
   */
  loadPreset(name: string): LayoutConfig {
    const filename = this.sanitizeFilename(name) + '.json';
    const filepath = path.join(this.presetsDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Preset not found: ${name}`);
    }

    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data) as LayoutConfig;
  }

  /**
   * List all available presets
   */
  listPresets(): string[] {
    const files = fs.readdirSync(this.presetsDir);
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json'));
  }

  /**
   * Delete a preset
   */
  deletePreset(name: string): void {
    const filename = this.sanitizeFilename(name) + '.json';
    const filepath = path.join(this.presetsDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Preset not found: ${name}`);
    }

    fs.unlinkSync(filepath);
  }

  /**
   * Check if a preset exists
   */
  presetExists(name: string): boolean {
    const filename = this.sanitizeFilename(name) + '.json';
    const filepath = path.join(this.presetsDir, filename);
    return fs.existsSync(filepath);
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  }

  /**
   * Create default presets if they don't exist
   */
  initializeDefaultPresets(): void {
    const defaultPresets: LayoutConfig[] = [
      {
        name: 'Two Person Interview',
        cuttingMethod: 'automatic',
        multiShotFrequency: 'low',
        speakerCount: 2,
        cameraCount: 3,
        speakers: [
          {
            speakerName: 'Speaker 1',
            audioTrackId: 'A1',
            cameraIndex: 0,
            videoTrackId: 'V1',
          },
          {
            speakerName: 'Speaker 2',
            audioTrackId: 'A2',
            cameraIndex: 1,
            videoTrackId: 'V2',
          },
        ],
        wideShot: {
          enabled: true,
          cameraIndex: 2,
          videoTrackId: 'V3',
        },
      },
      {
        name: 'Podcast Two Hosts',
        cuttingMethod: 'automatic',
        multiShotFrequency: 'medium',
        speakerCount: 2,
        cameraCount: 2,
        speakers: [
          {
            speakerName: 'Host 1',
            audioTrackId: 'A1',
            cameraIndex: 0,
            videoTrackId: 'V1',
          },
          {
            speakerName: 'Host 2',
            audioTrackId: 'A2',
            cameraIndex: 1,
            videoTrackId: 'V2',
          },
        ],
        wideShot: {
          enabled: false,
          cameraIndex: 0,
          videoTrackId: 'V1',
        },
      },
      {
        name: 'Panel Discussion',
        cuttingMethod: 'automatic',
        multiShotFrequency: 'high',
        speakerCount: 4,
        cameraCount: 5,
        speakers: [
          {
            speakerName: 'Panelist 1',
            audioTrackId: 'A1',
            cameraIndex: 0,
            videoTrackId: 'V1',
          },
          {
            speakerName: 'Panelist 2',
            audioTrackId: 'A2',
            cameraIndex: 1,
            videoTrackId: 'V2',
          },
          {
            speakerName: 'Panelist 3',
            audioTrackId: 'A3',
            cameraIndex: 2,
            videoTrackId: 'V3',
          },
          {
            speakerName: 'Panelist 4',
            audioTrackId: 'A4',
            cameraIndex: 3,
            videoTrackId: 'V4',
          },
        ],
        wideShot: {
          enabled: true,
          cameraIndex: 4,
          videoTrackId: 'V5',
        },
      },
    ];

    for (const preset of defaultPresets) {
      if (!this.presetExists(preset.name)) {
        this.savePreset(preset);
      }
    }
  }
}

/**
 * Default audio analysis configuration
 */
export function getDefaultAudioConfig(): AudioAnalysisConfig {
  return {
    sampleRate: 44100,
    windowSize: 100, // 100ms windows
    silenceThreshold: -30, // -30dB
    activeSpeakerThreshold: -20, // -20dB
    minCutDuration: 1.5, // 1.5 seconds minimum between cuts
    multiSpeakerThreshold: 2, // 2+ speakers for multi-shot
  };
}
