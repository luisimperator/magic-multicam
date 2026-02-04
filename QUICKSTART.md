# ⚡ Quick Start Guide

Get up and running with Magic MultiCam in 5 minutes!

## Installation

```bash
git clone https://github.com/yourusername/magic-multicam.git
cd magic-multicam
npm install
npm run build
```

## Your First Edit

### Step 1: Prepare Your Audio

Export isolated audio tracks from your multicam sequence in Premiere:

1. Select your multicam clip
2. File → Export → Audio
3. Export each speaker's audio as a separate WAV file

```
📁 project/
  ├── speaker1.wav
  └── speaker2.wav
```

### Step 2: Run Magic MultiCam

```bash
npm run dev -- process \
  -a speaker1.wav speaker2.wav \
  -p "Two Person Interview" \
  -o my-edit.jsx
```

You should see:

```
✔ Processing complete!

Results:
  Duration: 120.50s
  Total cuts: 15
  Average cut duration: 8.03s
  Multi-shot usage: 12.5%

Speaker talk time:
  Speaker 1: 65.2s (54.1%)
  Speaker 2: 55.3s (45.9%)

Output written to: my-edit.jsx

Next steps:
  1. Open Adobe Premiere Pro
  2. Open your multicam sequence
  3. Run: File > Scripts > Run Script File... > my-edit.jsx
```

### Step 3: Apply in Premiere Pro

1. Open your multicam sequence in Premiere Pro
2. Go to **File → Scripts → Run Script File...**
3. Select `my-edit.jsx`
4. Watch the magic happen!

## Understanding Presets

### List Available Presets

```bash
npm run dev -- preset list
```

Output:
```
Available presets:
  - two_person_interview
  - podcast_two_hosts
  - panel_discussion
```

### View Preset Details

```bash
npm run dev -- preset show "Two Person Interview"
```

Output:
```
Preset: Two Person Interview
  Cutting method: automatic
  Multi-shot frequency: low
  Speakers: 2
  Cameras: 3

  Speaker mapping:
    A1 (Speaker 1) → V1 (Camera 1)
    A2 (Speaker 2) → V2 (Camera 2)

  Wide shot: V3 (Camera 3)
```

## Common Use Cases

### Podcast (2 Hosts, No Wide Shot)

```bash
npm run dev -- process \
  -a host1.wav host2.wav \
  -p "Podcast Two Hosts" \
  -o podcast.jsx
```

### Panel Discussion (4 People + Wide Shot)

```bash
npm run dev -- process \
  -a panelist1.wav panelist2.wav panelist3.wav panelist4.wav \
  -p "Panel Discussion" \
  -o panel.jsx
```

### Custom Frame Rate

```bash
npm run dev -- process \
  -a speaker1.wav speaker2.wav \
  -p "Two Person Interview" \
  -f 29.97 \
  -o interview.jsx
```

### Custom Timecode Start

```bash
npm run dev -- process \
  -a speaker1.wav speaker2.wav \
  -p "Two Person Interview" \
  --timecode "01:00:00:00" \
  -o interview.jsx
```

## Troubleshooting

### "Audio file not found"

Use absolute paths:

```bash
npm run dev -- process \
  -a /Users/you/project/speaker1.wav /Users/you/project/speaker2.wav \
  -o edit.jsx
```

### "Expected 2 audio files, got 3"

The preset determines how many audio files are needed:
- "Two Person Interview" = 2 files
- "Panel Discussion" = 4 files

Either use a different preset or create a custom one.

### No cuts generated

Your audio might be too quiet. Check:
1. Audio levels (should peak above -20dB)
2. Files are actually different (not duplicates)
3. WAV format is correct (16-bit or 24-bit PCM)

### Script does nothing in Premiere

Make sure:
1. You have a multicam sequence active
2. The multicam clip is on Video Track 1 (or specify `--video-track`)
3. The sequence contains a multicam clip (not individual clips)

## Next Steps

- Read the [full README](README.md) for advanced features
- Check [examples/](examples/) for programmatic usage
- Create custom presets in `~/.magic-multicam/presets/`
- Adjust audio sensitivity in your custom config

## Tips for Best Results

1. **Clean audio**: Remove background noise before processing
2. **Proper levels**: Normalize audio to -3dB to -6dB peaks
3. **Isolated tracks**: Each speaker on separate audio file
4. **Match sync**: Audio and video must be perfectly synced
5. **Review first**: Always review auto-edits before exporting

## Help

```bash
npm run dev -- --help
npm run dev -- process --help
npm run dev -- preset --help
```

---

Happy editing! 🎬
