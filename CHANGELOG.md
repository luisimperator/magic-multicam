# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-15

### Added

- Initial release of Magic MultiCam
- Audio analysis engine with RMS detection
- Hysteresis filtering to prevent rapid camera switching
- Multi-shot frequency control (low/medium/high)
- Preset management system with 3 default presets:
  - Two Person Interview
  - Podcast Two Hosts
  - Panel Discussion
- CLI interface with commands:
  - `process`: Process audio files and generate JSX
  - `preset list`: List available presets
  - `preset show`: Show preset details
  - `preset delete`: Delete a preset
  - `info`: Show information about the tool
- ExtendScript (JSX) generator for Adobe Premiere Pro
- Quality Engineering (QE) API support for multicam editing
- Timecode conversion utilities
- TypeScript type definitions
- Comprehensive documentation:
  - README with full feature documentation
  - QUICKSTART guide for new users
  - CONTRIBUTING guidelines
  - Examples directory with usage samples
- WAV file decoding support (16-bit, 24-bit, 32-bit PCM)
- Configurable audio analysis parameters:
  - Window size (default: 100ms)
  - Silence threshold (default: -30dB)
  - Active speaker threshold (default: -20dB)
  - Minimum cut duration (default: 1.5s)
  - Multi-speaker threshold (default: 2 speakers)
- Statistics generation:
  - Total cuts
  - Average cut duration
  - Speaker talk time percentages
  - Multi-shot usage percentage

### Technical Details

- Built with TypeScript 5.3+
- Node.js 18+ required
- ESM module system
- Commander.js for CLI
- Chalk for colored output
- Ora for loading spinners
- Zero runtime dependencies for core functionality

[0.1.0]: https://github.com/yourusername/magic-multicam/releases/tag/v0.1.0
