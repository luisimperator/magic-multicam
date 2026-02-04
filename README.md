# 🎬 Magic MultiCam

AutoPod-inspired multi-camera editor for Adobe Premiere Pro. Automatically generate camera switches based on audio analysis.

---

## ⚠️ PROPRIETARY SOFTWARE NOTICE

**This is NOT open source software.**

- **All Rights Reserved** - Copyright © 2024
- Unauthorized copying, distribution, or use is **strictly prohibited**
- See [COPYRIGHT.md](COPYRIGHT.md) and [LICENSE](LICENSE) for details
- This repository is private and confidential

---

## ✨ Features

- **Automatic Audio Analysis**: Detects active speakers using RMS level detection
- **Hysteresis Filtering**: Prevents rapid, jarring camera switches
- **Multi-Shot Control**: Configurable frequency for wide shots during multi-speaker moments
- **Preset Management**: Save and reuse common setups (interviews, podcasts, panels)
- **Quality Engineering API**: Uses Premiere's powerful internal API for reliable multicam editing
- **ExtendScript Generation**: Outputs ES3-compatible scripts that run directly in Premiere Pro

## 🚀 Quick Start

### Installation

```bash
npm install
npm run build
```

### Basic Usage

1. Export isolated audio tracks from your multicam footage (WAV format)
2. Run the processor:

```bash
npm run dev -- process \
  -a speaker1.wav speaker2.wav \
  -p "Two Person Interview" \
  -o multicam-edit.jsx
```

3. In Premiere Pro:
   - Open your multicam sequence
   - Go to **File > Scripts > Run Script File...**
   - Select `multicam-edit.jsx`
   - Watch the magic happen!

## 📋 How It Works

### Architecture

```
Audio Files (WAV)
      ↓
Audio Analysis (RMS Detection)
      ↓
Speaker Selection (with Hysteresis)
      ↓
Multi-Shot Logic
      ↓
ExtendScript Generation
      ↓
Premiere Pro Execution
```

### 1. Audio Analysis

The system processes audio in 100ms windows, calculating RMS (Root Mean Square) levels in decibels:

- **Silence Threshold**: -30dB (configurable)
- **Active Speaker Threshold**: -20dB (configurable)
- **Window Size**: 100ms (configurable)

```typescript
// Example: Custom audio config
{
  sampleRate: 44100,
  windowSize: 100,           // 100ms
  silenceThreshold: -30,     // -30dB
  activeSpeakerThreshold: -20, // -20dB
  minCutDuration: 1.5,       // 1.5s minimum between cuts
  multiSpeakerThreshold: 2   // 2+ speakers for multi-shot
}
```

### 2. Hysteresis Filter

Prevents "tennis match" editing by enforcing a minimum duration before switching cameras:

- A new speaker must be **consistently louder** for at least 1.5 seconds (configurable)
- This creates smooth, professional-looking edits
- Similar to how AutoPod's "Cutting Method" works

### 3. Multi-Shot Frequency

Controls when to use the wide shot during overlapping speech:

| Frequency | Behavior |
|-----------|----------|
| **Low**   | Wide shot only when 3+ speakers are very active |
| **Medium**| Wide shot when 3+ speakers active, or 50% chance for 2 speakers |
| **High**  | Wide shot whenever 2+ speakers are active |

### 4. ExtendScript Generation

Generates ES3-compatible JavaScript that uses Premiere's Quality Engineering (QE) API:

```javascript
// Generated code (simplified)
var qeClip = qe.project.getActiveSequence()
  .getVideoTrackAt(0).getItemAt(i);

qeClip.setMultiCameraChannel(cameraIndex, timecodeInTicks);
```

## 📖 CLI Commands

### Process Audio Files

```bash
magic-multicam process [options]

Options:
  -a, --audio <files...>     Audio files (WAV format, space-separated)
  -p, --preset <name>        Layout preset name (default: "Two Person Interview")
  -o, --output <file>        Output JSX file path (default: "./multicam-edit.jsx")
  -f, --fps <number>         Frame rate (default: "24")
  --timecode <timecode>      Start timecode (default: "00:00:00:00")
  --video-track <index>      Video track index (default: "0")
  --no-comments              Disable comments in JSX
  --no-qe                    Use standard API instead of QE API
  --sequence-name <name>     Sequence name (default: "Multicam Sequence")
```

### Preset Management

```bash
# List all presets
magic-multicam preset list

# Show preset details
magic-multicam preset show "Two Person Interview"

# Delete a preset
magic-multicam preset delete "My Custom Preset"
```

## 🎛️ Presets

### Default Presets

1. **Two Person Interview**
   - 2 speakers, 3 cameras (2 close-ups + 1 wide)
   - Low multi-shot frequency
   - Ideal for: interviews, 1-on-1 podcasts

2. **Podcast Two Hosts**
   - 2 speakers, 2 cameras (no wide shot)
   - Medium multi-shot frequency
   - Ideal for: conversational podcasts

3. **Panel Discussion**
   - 4 speakers, 5 cameras (4 close-ups + 1 wide)
   - High multi-shot frequency
   - Ideal for: roundtables, panel discussions

### Creating Custom Presets

Presets are stored in `~/.magic-multicam/presets/` as JSON files:

```json
{
  "name": "My Custom Setup",
  "cuttingMethod": "automatic",
  "multiShotFrequency": "medium",
  "speakerCount": 2,
  "cameraCount": 3,
  "speakers": [
    {
      "speakerName": "Host",
      "audioTrackId": "A1",
      "cameraIndex": 0,
      "videoTrackId": "V1"
    },
    {
      "speakerName": "Guest",
      "audioTrackId": "A2",
      "cameraIndex": 1,
      "videoTrackId": "V2"
    }
  ],
  "wideShot": {
    "enabled": true,
    "cameraIndex": 2,
    "videoTrackId": "V3"
  }
}
```

## 🔧 Advanced Usage

### Programmatic API

```typescript
import { MultiCamProcessor, getDefaultAudioConfig } from 'magic-multicam';

const job = {
  layout: myLayoutConfig,
  audioInputs: [
    { filePath: 'speaker1.wav', speakerIndex: 0, trackId: 'A1' },
    { filePath: 'speaker2.wav', speakerIndex: 1, trackId: 'A2' },
  ],
  audioConfig: getDefaultAudioConfig(),
  sequenceConfig: {
    name: 'My Sequence',
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
  outputPath: './output.jsx',
};

const processor = new MultiCamProcessor(job);
const result = await processor.process();

console.log(`Generated ${result.stats.totalCuts} cuts`);
console.log(`Multi-shot usage: ${result.stats.multiShotUsage}%`);
```

### Custom Audio Configuration

```typescript
import { getDefaultAudioConfig } from 'magic-multicam';

const config = getDefaultAudioConfig();

// Make it more aggressive (more cuts)
config.minCutDuration = 0.8;  // Shorter minimum duration
config.activeSpeakerThreshold = -25;  // Lower threshold

// Make it more conservative (fewer cuts)
config.minCutDuration = 2.5;  // Longer minimum duration
config.activeSpeakerThreshold = -15;  // Higher threshold
```

## 🎯 Comparison with AutoPod

| Feature | AutoPod | Magic MultiCam |
|---------|---------|----------------|
| **Price** | $349/year | Proprietary License |
| **Processing** | In Premiere (slow) | External (fast) |
| **Customization** | Limited UI options | Full code access |
| **Audio Analysis** | Proprietary | RMS-based (transparent) |
| **API Used** | Premiere Standard | QE API (more powerful) |
| **Presets** | Built-in only | Unlimited custom JSON |
| **Platform** | Premiere extension | CLI + Programmatic API |

## 🛠️ Technical Details

### Why External Processing?

AutoPod runs entirely inside Premiere Pro's ExtendScript engine, which is:
- Single-threaded
- ES3 only (very old JavaScript)
- Slow for intensive calculations

Magic MultiCam does the heavy lifting (audio analysis) in modern Node.js, then generates a simple ExtendScript that just applies the decisions. This is **significantly faster**.

### Quality Engineering (QE) API

Premiere has two APIs:
1. **Standard API**: Limited, documented, safe
2. **QE API**: Powerful, internal, undocumented

We use the QE API (`qe.project.getActiveSequence()`) for multicam control because:
- More reliable for multicam operations
- Direct camera channel switching
- Better performance

### Hysteresis Algorithm

The hysteresis filter prevents rapid switching:

```
Current speaker: A
Candidate: B (louder than A)
Time since B became candidate: 0.5s

Decision: Stay on A (not long enough)

---

Current speaker: A
Candidate: B (louder than A)
Time since B became candidate: 2.0s

Decision: Switch to B (exceeded 1.5s threshold)
```

## 🐛 Troubleshooting

### "No active sequence found"

Make sure you have a multicam sequence open and active in Premiere before running the script.

### "Audio file not found"

Use absolute paths or ensure your current working directory is correct:

```bash
magic-multicam process -a /full/path/to/audio1.wav /full/path/to/audio2.wav
```

### "Only WAV files are supported"

Convert your audio to WAV format first:

```bash
ffmpeg -i input.mp3 output.wav
```

### No cuts are being generated

Check your audio levels:
- Files might be too quiet (below -30dB)
- Adjust thresholds in your audio config
- Verify the WAV files have actual audio data

## 📝 Workflow Example

### Full Podcast Editing Workflow

1. **Record multicam footage** with isolated audio tracks

2. **Create multicam clip** in Premiere Pro

3. **Export audio tracks** as WAV:
   ```
   File > Export > Audio
   - Track 1: host.wav
   - Track 2: guest.wav
   ```

4. **Run Magic MultiCam**:
   ```bash
   magic-multicam process \
     -a host.wav guest.wav \
     -p "Podcast Two Hosts" \
     -o podcast-edit.jsx \
     --fps 23.976
   ```

5. **Review the output**:
   ```
   Results:
     Duration: 1847.23s
     Total cuts: 127
     Average cut duration: 14.5s
     Multi-shot usage: 8.2%
   ```

6. **Apply in Premiere**:
   - File > Scripts > Run Script File
   - Select `podcast-edit.jsx`
   - Done!

7. **Fine-tune manually** (if needed)

## 🛣️ Roadmap

Future improvements planned:

- [ ] Support for MP3/AAC input (via FFmpeg)
- [ ] Interactive preset creation CLI
- [ ] GUI electron app
- [ ] Machine learning-based speaker detection
- [ ] Support for more NLEs (DaVinci Resolve, Final Cut Pro)
- [ ] Real-time preview mode

## 📄 License

**PROPRIETARY SOFTWARE - All Rights Reserved**

This software is proprietary and confidential. Unauthorized copying, distribution,
modification, or use of this software is strictly prohibited. See [LICENSE](LICENSE) for details.

## 🙏 Credits

Inspired by [AutoPod](https://www.autopod.fm/) by Arie Stavchansky.

Built with:
- TypeScript
- Commander.js
- Chalk
- Ora

## 📞 Support

For support inquiries, please contact the software owner directly.

---

**Copyright © 2024 - All Rights Reserved**
