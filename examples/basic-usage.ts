/**
 * Basic usage example for Magic MultiCam
 */

import { MultiCamProcessor, getDefaultAudioConfig } from '../src/index.js';
import type { ProcessingJob, LayoutConfig } from '../src/index.js';

// Example 1: Simple two-person interview
async function basicExample() {
  const layout: LayoutConfig = {
    name: 'Two Person Interview',
    cuttingMethod: 'automatic',
    multiShotFrequency: 'low',
    speakerCount: 2,
    cameraCount: 3,
    speakers: [
      {
        speakerName: 'Host',
        audioTrackId: 'A1',
        cameraIndex: 0,
        videoTrackId: 'V1',
      },
      {
        speakerName: 'Guest',
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
  };

  const job: ProcessingJob = {
    layout,
    audioInputs: [
      {
        filePath: './audio/host.wav',
        speakerIndex: 0,
        trackId: 'A1',
      },
      {
        filePath: './audio/guest.wav',
        speakerIndex: 1,
        trackId: 'A2',
      },
    ],
    audioConfig: getDefaultAudioConfig(),
    sequenceConfig: {
      name: 'Interview Sequence',
      frameRate: 23.976,
      timecodeStart: '01:00:00:00',
      videoTrackIndex: 0,
      audioTrackIndices: [0, 1],
    },
    jsxOptions: {
      useQEAPI: true,
      addComments: true,
      optimizePerformance: true,
      validateSequence: true,
    },
    outputPath: './output/interview-edit.jsx',
  };

  const processor = new MultiCamProcessor(job);

  // Validate before processing
  const validation = processor.validateJob();
  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return;
  }

  // Process
  const result = await processor.process();

  console.log('Processing complete!');
  console.log(`Duration: ${result.duration}s`);
  console.log(`Total cuts: ${result.stats.totalCuts}`);
  console.log(`Average cut duration: ${result.stats.averageCutDuration}s`);
  console.log(`Multi-shot usage: ${result.stats.multiShotUsage}%`);
}

// Example 2: Custom audio configuration for aggressive editing
async function aggressiveEditingExample() {
  const audioConfig = getDefaultAudioConfig();

  // Make cuts more aggressive
  audioConfig.minCutDuration = 0.8; // Shorter minimum duration
  audioConfig.activeSpeakerThreshold = -25; // Lower threshold

  const job: ProcessingJob = {
    layout: {
      name: 'Fast Paced Podcast',
      cuttingMethod: 'automatic',
      multiShotFrequency: 'high',
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
    },
    audioInputs: [
      { filePath: './audio/host1.wav', speakerIndex: 0, trackId: 'A1' },
      { filePath: './audio/host2.wav', speakerIndex: 1, trackId: 'A2' },
    ],
    audioConfig,
    sequenceConfig: {
      name: 'Podcast',
      frameRate: 24,
      timecodeStart: '00:00:00:00',
      videoTrackIndex: 0,
      audioTrackIndices: [0, 1],
    },
    jsxOptions: {
      useQEAPI: true,
      addComments: true,
      optimizePerformance: true,
      validateSequence: true,
    },
    outputPath: './output/aggressive-edit.jsx',
  };

  const processor = new MultiCamProcessor(job);
  const result = await processor.process();

  console.log(`Generated ${result.stats.totalCuts} cuts (aggressive mode)`);
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample().catch(console.error);
}

export { basicExample, aggressiveEditingExample };
