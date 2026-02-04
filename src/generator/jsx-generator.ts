import { CutDecision, JSXGenerationOptions, SequenceConfig } from '../types/index.js';
import { TimecodeConverter } from './timecode-converter.js';

/**
 * Generates ExtendScript (.jsx) for Adobe Premiere Pro
 * Compatible with ES3 (no const/let, no arrow functions, no template literals)
 */
export class JSXGenerator {
  private options: JSXGenerationOptions;
  private sequenceConfig: SequenceConfig;
  private converter: TimecodeConverter;

  constructor(sequenceConfig: SequenceConfig, options: JSXGenerationOptions) {
    this.sequenceConfig = sequenceConfig;
    this.options = options;
    this.converter = new TimecodeConverter(sequenceConfig);
  }

  /**
   * Generate complete JSX script from cut decisions
   */
  generate(cuts: CutDecision[]): string {
    const lines: string[] = [];

    // Add header
    lines.push(this.generateHeader());

    // Add validation if enabled
    if (this.options.validateSequence) {
      lines.push(this.generateValidation());
    }

    // Add main processing function
    lines.push(this.generateMainFunction(cuts));

    // Add footer (execute main function)
    lines.push(this.generateFooter());

    return lines.join('\n\n');
  }

  /**
   * Generate script header with metadata
   */
  private generateHeader(): string {
    const comment = this.options.addComments
      ? `/**
 * Magic MultiCam - Automated Multi-Camera Editor
 * Generated: ${new Date().toISOString()}
 *
 * This script automates multi-camera editing in Adobe Premiere Pro
 * by switching camera angles based on audio analysis.
 *
 * IMPORTANT: This script uses ExtendScript (ES3). No modern JS syntax allowed.
 */`
      : '/* Magic MultiCam - Auto-generated script */';

    return comment;
  }

  /**
   * Generate validation code
   */
  private generateValidation(): string {
    return `function validateSequence() {
    if (!app.project.activeSequence) {
        alert("Error: No active sequence found. Please open a sequence and try again.");
        return false;
    }

    var seq = app.project.activeSequence;
    var videoTracks = seq.videoTracks;

    if (videoTracks.numTracks === 0) {
        alert("Error: No video tracks found in sequence.");
        return false;
    }

    if (${this.sequenceConfig.videoTrackIndex} >= videoTracks.numTracks) {
        alert("Error: Video track index " + ${this.sequenceConfig.videoTrackIndex} + " does not exist.");
        return false;
    }

    return true;
}`;
  }

  /**
   * Generate main processing function
   */
  private generateMainFunction(cuts: CutDecision[]): string {
    const lines: string[] = [];

    lines.push('function processMultiCamEdits() {');

    if (this.options.addComments) {
      lines.push('    // Get active sequence');
    }

    lines.push('    var seq = app.project.activeSequence;');
    lines.push('    var videoTrack = seq.videoTracks[' + this.sequenceConfig.videoTrackIndex + '];');

    if (this.options.addComments) {
      lines.push('    // Process each clip in the video track');
    }

    lines.push('    var numClips = videoTrack.clips.numItems;');
    lines.push('    ');
    lines.push('    for (var i = 0; i < numClips; i++) {');
    lines.push('        var clip = videoTrack.clips[i];');
    lines.push('        ');

    if (this.options.addComments) {
      lines.push('        // Check if clip is a multi-camera source');
    }

    if (this.options.useQEAPI) {
      lines.push('        if (clip.isMulticamClip && clip.isMulticamClip()) {');
      lines.push(this.generateQEAPIEdits(cuts));
      lines.push('        }');
    } else {
      lines.push('        // Standard API implementation');
      lines.push('        if (clip.name.indexOf("Multicam") !== -1) {');
      lines.push(this.generateStandardAPIEdits(cuts));
      lines.push('        }');
    }

    lines.push('    }');
    lines.push('    ');
    lines.push('    alert("Multi-camera editing complete! Applied " + ' + cuts.length + ' + " cuts.");');
    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Generate edits using Quality Engineering (QE) API
   * This is the more powerful internal API
   */
  private generateQEAPIEdits(cuts: CutDecision[]): string {
    const lines: string[] = [];

    lines.push('            var qeClip = qe.project.getActiveSequence().getVideoTrackAt(' + this.sequenceConfig.videoTrackIndex + ').getItemAt(i);');
    lines.push('            ');

    if (this.options.addComments) {
      lines.push('            // Apply camera switches at specified timecodes');
    }

    if (this.options.optimizePerformance) {
      // Batch operations
      lines.push('            var cuts = [');

      cuts.forEach((cut, index) => {
        const ticks = this.converter.secondsToTicks(cut.timestamp);
        const comma = index < cuts.length - 1 ? ',' : '';
        lines.push(`                {time: "${ticks}", camera: ${cut.cameraIndex}}${comma}`);
      });

      lines.push('            ];');
      lines.push('            ');
      lines.push('            for (var j = 0; j < cuts.length; j++) {');
      lines.push('                var cutData = cuts[j];');
      lines.push('                qeClip.setMultiCameraChannel(cutData.camera, cutData.time);');
      lines.push('            }');
    } else {
      // Individual operations
      cuts.forEach((cut) => {
        const ticks = this.converter.secondsToTicks(cut.timestamp);
        if (this.options.addComments) {
          lines.push(`            // ${cut.timecode} - Camera ${cut.cameraIndex + 1} (${cut.reason})`);
        }
        lines.push(`            qeClip.setMultiCameraChannel(${cut.cameraIndex}, "${ticks}");`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate edits using standard Premiere API
   * Less powerful but more compatible
   */
  private generateStandardAPIEdits(cuts: CutDecision[]): string {
    const lines: string[] = [];

    lines.push('            // Standard API has limited multicam support');
    lines.push('            // This is a fallback implementation');

    if (this.options.addComments) {
      lines.push('            // Note: May not work with all multicam configurations');
    }

    lines.push('            var component = clip.components[0];');
    lines.push('            if (component && component.properties) {');
    lines.push('                var props = component.properties;');
    lines.push('                for (var p = 0; p < props.numItems; p++) {');
    lines.push('                    var prop = props[p];');
    lines.push('                    if (prop.displayName === "Source Camera") {');

    cuts.forEach((cut) => {
      const ticks = this.converter.secondsToTicks(cut.timestamp);
      if (this.options.addComments) {
        lines.push(`                        // ${cut.timecode} - Camera ${cut.cameraIndex + 1}`);
      }
      lines.push(`                        prop.setValueAtTime("${ticks}", ${cut.cameraIndex});`);
    });

    lines.push('                    }');
    lines.push('                }');
    lines.push('            }');

    return lines.join('\n');
  }

  /**
   * Generate script footer
   */
  private generateFooter(): string {
    const lines: string[] = [];

    if (this.options.validateSequence) {
      lines.push('if (validateSequence()) {');
      lines.push('    processMultiCamEdits();');
      lines.push('}');
    } else {
      lines.push('processMultiCamEdits();');
    }

    return lines.join('\n');
  }

  /**
   * Generate a preview of the cuts as comments
   */
  generateCutsList(cuts: CutDecision[]): string {
    const lines: string[] = [];

    lines.push('/**');
    lines.push(' * Cut List Preview:');
    lines.push(' * ==================');

    cuts.forEach((cut, index) => {
      const cameraNum = cut.cameraIndex + 1;
      const speakersActive = cut.activeSpeakers.length;
      lines.push(
        ` * ${String(index + 1).padStart(3, ' ')}. ${cut.timecode} → Camera ${cameraNum} (${cut.reason}, ${speakersActive} active)`
      );
    });

    lines.push(' */');

    return lines.join('\n');
  }
}
