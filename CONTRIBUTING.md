# Contributing to Magic MultiCam

Thank you for your interest in contributing to Magic MultiCam! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/magic-multicam.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- --help

# Build TypeScript
npm run build

# Run tests (when available)
npm test

# Clean build artifacts
npm run clean
```

## Project Structure

```
src/
├── analyzer/           # Audio analysis modules
│   ├── audio-detector.ts    # WAV decoding and RMS calculation
│   ├── hysteresis.ts        # Cut smoothing algorithm
│   └── speaker-selection.ts # Camera selection logic
├── generator/          # ExtendScript generation
│   ├── jsx-generator.ts     # JSX code generation
│   └── timecode-converter.ts # Timecode utilities
├── config/            # Configuration management
│   └── preset-manager.ts    # Preset save/load
├── processor/         # Main orchestration
│   └── index.ts            # Job processor
├── cli/              # Command-line interface
│   └── index.ts           # CLI commands
└── types/            # TypeScript definitions
    └── index.ts          # Type definitions
```

## Coding Standards

### TypeScript

- Use strict TypeScript (enabled in tsconfig.json)
- Define explicit types for all function parameters and return values
- Use interfaces for complex types
- Avoid `any` type unless absolutely necessary

### Code Style

- Use ESM modules (`import/export`)
- 2-space indentation
- No semicolons (except where required)
- Single quotes for strings
- Meaningful variable names
- Document complex algorithms with comments

### Example

```typescript
/**
 * Calculate RMS level from audio samples
 * @param samples Audio sample buffer
 * @param start Start index
 * @param end End index
 * @returns RMS level in decibels
 */
function calculateRMS(samples: Float32Array, start: number, end: number): number {
  let sumSquares = 0;
  let count = 0;

  for (let i = start; i < end && i < samples.length; i++) {
    sumSquares += samples[i] * samples[i];
    count++;
  }

  if (count === 0) return -Infinity;

  const rms = Math.sqrt(sumSquares / count);
  return rms === 0 ? -Infinity : 20 * Math.log10(rms);
}
```

## Testing

Currently, the project uses manual testing. We welcome contributions to add automated tests!

### Testing Checklist

- [ ] Test with 2-speaker audio
- [ ] Test with 4-speaker audio
- [ ] Test with different frame rates (23.976, 24, 29.97, 30)
- [ ] Test with different timecode starts
- [ ] Test with very quiet audio
- [ ] Test with very loud audio
- [ ] Test CLI commands
- [ ] Test preset management
- [ ] Test generated JSX in Premiere Pro

## Areas for Contribution

### High Priority

- [ ] **Automated Testing**: Add unit tests with Vitest
- [ ] **Audio Format Support**: Add MP3/AAC support via FFmpeg
- [ ] **Interactive Preset Creation**: CLI wizard for creating presets
- [ ] **Error Handling**: Better error messages and recovery

### Medium Priority

- [ ] **Performance Optimization**: Optimize large file processing
- [ ] **Machine Learning**: ML-based speaker detection
- [ ] **GUI**: Electron-based desktop app
- [ ] **Plugin Support**: Custom analysis algorithms

### Low Priority

- [ ] **DaVinci Resolve Support**: Generate scripts for Resolve
- [ ] **Final Cut Pro Support**: Generate FCPXML
- [ ] **Real-time Preview**: Preview cuts before generation
- [ ] **Cloud Processing**: Remote processing service

## Making a Pull Request

1. Ensure your code builds without errors: `npm run build`
2. Test your changes thoroughly
3. Update documentation if needed (README, QUICKSTART, etc.)
4. Commit with descriptive messages:
   ```bash
   git commit -m "feat: add MP3 support via FFmpeg"
   git commit -m "fix: handle empty audio files gracefully"
   git commit -m "docs: update preset creation guide"
   ```
5. Push to your fork: `git push origin feature/your-feature-name`
6. Create a pull request on GitHub

### Commit Message Format

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding tests
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `chore:` Build/tooling changes

## Reporting Bugs

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Exact steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**:
   - OS (macOS, Windows, Linux)
   - Node.js version
   - Premiere Pro version (if applicable)
6. **Sample Files**: Audio files if possible (or description of characteristics)

## Feature Requests

When requesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: Your idea for solving it
3. **Alternatives**: Other approaches you've considered
4. **Examples**: Examples from other tools if applicable

## Documentation

Documentation improvements are always welcome!

- Fix typos or unclear instructions
- Add examples for common use cases
- Improve code comments
- Create tutorials or guides

## Questions?

- Open a GitHub Discussion for questions
- Check existing issues before opening new ones
- Join discussions on open PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Magic MultiCam! 🎬
