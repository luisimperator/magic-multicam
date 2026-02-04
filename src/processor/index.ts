import fs from 'fs';
import { AudioDetector } from '../analyzer/audio-detector.js';
import { SpeakerSelector } from '../analyzer/speaker-selection.js';
import { JSXGenerator } from '../generator/jsx-generator.js';
import { ProcessingJob, AnalysisResult } from '../types/index.js';

/**
 * Main processor that orchestrates the entire pipeline:
 * 1. Audio analysis
 * 2. Speaker selection with hysteresis
 * 3. JSX generation
 */
export class MultiCamProcessor {
  private job: ProcessingJob;

  constructor(job: ProcessingJob) {
    this.job = job;
  }

  /**
   * Process the job and generate JSX output
   */
  async process(): Promise<AnalysisResult> {
    // Step 1: Analyze audio files
    const detector = new AudioDetector(this.job.audioConfig);
    const windows = await detector.analyze(this.job.audioInputs);

    if (windows.length === 0) {
      throw new Error('No audio data found in input files');
    }

    // Step 2: Generate cut decisions
    const selector = new SpeakerSelector(this.job.audioConfig, this.job.layout);
    const cuts = selector.generateCuts(windows);

    if (cuts.length === 0) {
      throw new Error('No cuts generated - check audio levels and thresholds');
    }

    // Step 3: Calculate duration
    const duration = windows[windows.length - 1].timestamp;

    // Step 4: Calculate statistics
    const stats = selector.calculateStats(cuts, duration);

    // Step 5: Generate JSX
    const generator = new JSXGenerator(this.job.sequenceConfig, this.job.jsxOptions);
    const jsxCode = generator.generate(cuts);

    // Step 6: Add cut list preview if comments enabled
    let finalCode = jsxCode;
    if (this.job.jsxOptions.addComments) {
      const cutsList = generator.generateCutsList(cuts);
      finalCode = cutsList + '\n\n' + jsxCode;
    }

    // Step 7: Write output file
    fs.writeFileSync(this.job.outputPath, finalCode, 'utf8');

    // Return analysis result
    return {
      duration,
      cuts,
      stats,
    };
  }

  /**
   * Validate job configuration before processing
   */
  validateJob(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate audio inputs
    if (this.job.audioInputs.length === 0) {
      errors.push('No audio input files provided');
    }

    for (const input of this.job.audioInputs) {
      if (!fs.existsSync(input.filePath)) {
        errors.push(`Audio file not found: ${input.filePath}`);
      }

      // Check file extension
      if (!input.filePath.toLowerCase().endsWith('.wav')) {
        errors.push(`Only WAV files are supported: ${input.filePath}`);
      }
    }

    // Validate layout
    if (this.job.layout.speakers.length === 0) {
      errors.push('No speakers configured in layout');
    }

    if (this.job.layout.speakers.length !== this.job.audioInputs.length) {
      errors.push(
        `Speaker count mismatch: ${this.job.layout.speakers.length} speakers configured, ` +
          `${this.job.audioInputs.length} audio files provided`
      );
    }

    // Validate audio config
    if (this.job.audioConfig.windowSize <= 0) {
      errors.push('Window size must be positive');
    }

    if (this.job.audioConfig.minCutDuration < 0) {
      errors.push('Minimum cut duration must be non-negative');
    }

    // Validate sequence config
    if (this.job.sequenceConfig.frameRate <= 0) {
      errors.push('Frame rate must be positive');
    }

    // Validate output path
    const outputDir = this.job.outputPath.substring(
      0,
      this.job.outputPath.lastIndexOf('/')
    );
    if (outputDir && !fs.existsSync(outputDir)) {
      errors.push(`Output directory does not exist: ${outputDir}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
