/**
 * Magic MultiCam - AutoPod Clone for Adobe Premiere Pro
 *
 * Main entry point for programmatic usage
 */

export { AudioDetector, WavDecoder } from './analyzer/audio-detector.js';
export { HysteresisFilter } from './analyzer/hysteresis.js';
export { SpeakerSelector } from './analyzer/speaker-selection.js';
export { JSXGenerator } from './generator/jsx-generator.js';
export { TimecodeConverter } from './generator/timecode-converter.js';
export { PresetManager, getDefaultAudioConfig } from './config/preset-manager.js';
export { MultiCamProcessor } from './processor/index.js';

export * from './types/index.js';
