#!/usr/bin/env node

/**
 * Magic MultiCam CLI
 *
 * PROPRIETARY SOFTWARE - All Rights Reserved
 * Copyright (c) 2024
 *
 * Unauthorized copying, distribution, modification, or use of this
 * software is strictly prohibited.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { PresetManager, getDefaultAudioConfig } from '../config/preset-manager.js';
import { MultiCamProcessor } from '../processor/index.js';
import {
  ProcessingJob,
  AudioInput,
  LayoutConfig,
  SequenceConfig,
  JSXGenerationOptions,
} from '../types/index.js';

const program = new Command();

program
  .name('magic-multicam')
  .description('AutoPod-inspired multi-camera editor for Adobe Premiere Pro')
  .version('0.1.0');

/**
 * Process command - main functionality
 */
program
  .command('process')
  .description('Process audio files and generate Premiere Pro script')
  .requiredOption('-a, --audio <files...>', 'Audio files (WAV format, space-separated)')
  .option('-p, --preset <name>', 'Layout preset name', 'Two Person Interview')
  .option('-o, --output <file>', 'Output JSX file path', './multicam-edit.jsx')
  .option('-f, --fps <number>', 'Frame rate', '24')
  .option('--timecode <timecode>', 'Start timecode', '00:00:00:00')
  .option('--video-track <index>', 'Video track index', '0')
  .option('--no-comments', 'Disable comments in JSX')
  .option('--no-qe', 'Use standard API instead of QE API')
  .option('--sequence-name <name>', 'Sequence name', 'Multicam Sequence')
  .action(async (options) => {
    const spinner = ora('Initializing...').start();

    try {
      // Load preset
      const presetManager = new PresetManager();
      presetManager.initializeDefaultPresets();

      spinner.text = `Loading preset: ${options.preset}`;
      const layout = presetManager.loadPreset(options.preset);

      // Validate audio files
      const audioFiles: string[] = options.audio;
      if (audioFiles.length !== layout.speakerCount) {
        spinner.fail(
          chalk.red(
            `Error: Expected ${layout.speakerCount} audio files for preset "${options.preset}", got ${audioFiles.length}`
          )
        );
        process.exit(1);
      }

      // Create audio inputs
      const audioInputs: AudioInput[] = audioFiles.map((file, index) => ({
        filePath: path.resolve(file),
        speakerIndex: index,
        trackId: layout.speakers[index].audioTrackId,
      }));

      // Validate files exist
      for (const input of audioInputs) {
        if (!fs.existsSync(input.filePath)) {
          spinner.fail(chalk.red(`Error: Audio file not found: ${input.filePath}`));
          process.exit(1);
        }
      }

      // Create sequence config
      const sequenceConfig: SequenceConfig = {
        name: options.sequenceName,
        frameRate: parseFloat(options.fps),
        timecodeStart: options.timecode,
        videoTrackIndex: parseInt(options.videoTrack),
        audioTrackIndices: audioInputs.map((_, i) => i),
      };

      // Create JSX options
      const jsxOptions: JSXGenerationOptions = {
        useQEAPI: options.qe !== false,
        addComments: options.comments !== false,
        optimizePerformance: true,
        validateSequence: true,
      };

      // Create processing job
      const job: ProcessingJob = {
        layout,
        audioInputs,
        audioConfig: getDefaultAudioConfig(),
        sequenceConfig,
        jsxOptions,
        outputPath: path.resolve(options.output),
      };

      // Validate job
      const processor = new MultiCamProcessor(job);
      const validation = processor.validateJob();

      if (!validation.valid) {
        spinner.fail(chalk.red('Validation errors:'));
        validation.errors.forEach((error) => {
          console.log(chalk.red(`  - ${error}`));
        });
        process.exit(1);
      }

      // Process
      spinner.text = 'Analyzing audio files...';
      const result = await processor.process();

      spinner.succeed(chalk.green('Processing complete!'));

      // Display results
      console.log('');
      console.log(chalk.bold('Results:'));
      console.log(chalk.cyan(`  Duration: ${result.duration.toFixed(2)}s`));
      console.log(chalk.cyan(`  Total cuts: ${result.stats.totalCuts}`));
      console.log(
        chalk.cyan(
          `  Average cut duration: ${result.stats.averageCutDuration.toFixed(2)}s`
        )
      );
      console.log(
        chalk.cyan(`  Multi-shot usage: ${result.stats.multiShotUsage.toFixed(1)}%`)
      );

      console.log('');
      console.log(chalk.bold('Speaker talk time:'));
      Object.entries(result.stats.speakerTalkTime).forEach(([speaker, time]) => {
        const percentage = (time / result.duration) * 100;
        console.log(
          chalk.cyan(`  Speaker ${parseInt(speaker) + 1}: ${time.toFixed(1)}s (${percentage.toFixed(1)}%)`)
        );
      });

      console.log('');
      console.log(chalk.green(`Output written to: ${options.output}`));
      console.log('');
      console.log(chalk.yellow('Next steps:'));
      console.log(
        chalk.yellow('  1. Open Adobe Premiere Pro')
      );
      console.log(chalk.yellow('  2. Open your multicam sequence'));
      console.log(
        chalk.yellow(`  3. Run: File > Scripts > Run Script File... > ${options.output}`)
      );
    } catch (error) {
      spinner.fail(chalk.red('Error: ' + (error as Error).message));
      if (process.env.DEBUG) {
        console.error(error);
      }
      process.exit(1);
    }
  });

/**
 * Preset management commands
 */
const presetCmd = program.command('preset').description('Manage layout presets');

presetCmd
  .command('list')
  .description('List all available presets')
  .action(() => {
    const manager = new PresetManager();
    manager.initializeDefaultPresets();
    const presets = manager.listPresets();

    console.log(chalk.bold('\nAvailable presets:'));
    presets.forEach((preset) => {
      console.log(chalk.cyan(`  - ${preset}`));
    });
    console.log('');
  });

presetCmd
  .command('show <name>')
  .description('Show details of a preset')
  .action((name: string) => {
    try {
      const manager = new PresetManager();
      const preset = manager.loadPreset(name);

      console.log(chalk.bold(`\nPreset: ${preset.name}`));
      console.log(chalk.cyan(`  Cutting method: ${preset.cuttingMethod}`));
      console.log(chalk.cyan(`  Multi-shot frequency: ${preset.multiShotFrequency}`));
      console.log(chalk.cyan(`  Speakers: ${preset.speakerCount}`));
      console.log(chalk.cyan(`  Cameras: ${preset.cameraCount}`));

      console.log(chalk.bold('\n  Speaker mapping:'));
      preset.speakers.forEach((speaker) => {
        console.log(
          chalk.cyan(
            `    ${speaker.audioTrackId} (${speaker.speakerName}) → ${speaker.videoTrackId} (Camera ${speaker.cameraIndex + 1})`
          )
        );
      });

      if (preset.wideShot?.enabled) {
        console.log(
          chalk.bold(
            `\n  Wide shot: ${preset.wideShot.videoTrackId} (Camera ${preset.wideShot.cameraIndex + 1})`
          )
        );
      }

      console.log('');
    } catch (error) {
      console.log(chalk.red('Error: ' + (error as Error).message));
      process.exit(1);
    }
  });

presetCmd
  .command('create <name>')
  .description('Create a new preset interactively')
  .action((name: string) => {
    console.log(chalk.yellow('Interactive preset creation not yet implemented'));
    console.log(chalk.yellow('You can manually create a preset JSON file in:'));
    console.log(chalk.cyan('  ~/.magic-multicam/presets/'));
    process.exit(0);
  });

presetCmd
  .command('delete <name>')
  .description('Delete a preset')
  .action((name: string) => {
    try {
      const manager = new PresetManager();
      manager.deletePreset(name);
      console.log(chalk.green(`Preset "${name}" deleted successfully`));
    } catch (error) {
      console.log(chalk.red('Error: ' + (error as Error).message));
      process.exit(1);
    }
  });

/**
 * Info command
 */
program
  .command('info')
  .description('Show information about Magic MultiCam')
  .action(() => {
    console.log(chalk.bold('\n🎬 Magic MultiCam'));
    console.log(chalk.cyan('AutoPod-inspired multi-camera editor for Adobe Premiere Pro\n'));
    console.log(chalk.bold('Features:'));
    console.log(chalk.cyan('  ✓ Automatic audio analysis with RMS detection'));
    console.log(chalk.cyan('  ✓ Hysteresis filtering to prevent rapid cuts'));
    console.log(chalk.cyan('  ✓ Multi-shot frequency control (low/medium/high)'));
    console.log(chalk.cyan('  ✓ Preset management for common setups'));
    console.log(chalk.cyan('  ✓ Quality Engineering (QE) API support'));
    console.log(chalk.cyan('  ✓ ExtendScript generation for Premiere Pro\n'));
    console.log(chalk.bold('Usage:'));
    console.log(chalk.yellow('  magic-multicam process -a audio1.wav audio2.wav'));
    console.log(chalk.yellow('  magic-multicam preset list'));
    console.log(chalk.yellow('  magic-multicam preset show "Two Person Interview"\n'));
  });

program.parse();
