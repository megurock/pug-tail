# pug-tail Release Roadmap

## 📋 Overview

This document outlines the process and tasks for preparing pug-tail for its first public release (alpha 1.0.0).

---

## 🎯 Release Strategy

### Package Structure

**Two separate packages:**

1. **`pug-tail`** (Core library)
   - Transform functions
   - AST transformation logic
   - Component/Slot system
   - Programmatic API

2. **`pug-tail-cli`** (Command-line interface)
   - CLI wrapper around pug-tail core
   - File processing
   - Watch mode
   - Frontmatter support

**Benefits:**
- Users who only need the core library don't need CLI dependencies (chokidar, glob, yaml)
- Cleaner separation of concerns
- Independent versioning possible
- Smaller package sizes

---

## 📅 Release Timeline

### Phase 0: Real-World Testing (Current)

**Goal:** Use pug-tail in a real project to identify issues

- [ ] Set up a test project using pug-tail
- [ ] Build a small website/application
- [ ] Document pain points and missing features
- [ ] Collect performance metrics
- [ ] Identify edge cases

**Deliverables:**
- List of bugs/issues found
- Feature requests based on actual usage
- Performance baseline

---

### Phase 1: Package Restructuring (1-2 weeks)

**Goal:** Split into two packages

#### 1.1: Core Package (`pug-tail`)

- [ ] Create new directory structure:
  ```
  packages/
  ├── pug-tail/           # Core library
  │   ├── src/
  │   ├── tests/
  │   ├── package.json
  │   └── README.md
  └── pug-tail-cli/       # CLI package
      ├── src/
      ├── tests/
      ├── package.json
      └── README.md
  ```

- [ ] Move core transformation logic to `pug-tail`:
  - `src/core/`
  - `src/transform.ts`
  - `src/types/`

- [ ] Update `package.json`:
  - Remove CLI-specific dependencies (chokidar, glob, yaml)
  - Set up proper exports
  - Define peer dependencies

- [ ] Create minimal README for core package

#### 1.2: CLI Package (`pug-tail-cli`)

- [ ] Move CLI logic to `pug-tail-cli`:
  - `src/cli/`
  - `src/cli.ts`

- [ ] Update `package.json`:
  - Add `pug-tail` as dependency
  - Keep CLI dependencies (chokidar, glob, yaml)
  - Define bin entry point

- [ ] Create CLI-specific README

#### 1.3: Monorepo Setup (Optional)

- [ ] Consider using npm workspaces or lerna
- [ ] Shared tooling configuration (tsconfig, biome, vitest)
- [ ] Cross-package testing

---

### Phase 2: Test Coverage Enhancement (1 week)

**Goal:** Improve test coverage to 80%+

#### 2.1: Identify Low Coverage Areas

- [ ] Run coverage report: `npm run test:coverage`
- [ ] Identify files/functions with <60% coverage
- [ ] Prioritize critical paths

#### 2.2: Add Missing Tests

**Core Library:**
- [ ] Error handling edge cases
- [ ] Complex component nesting scenarios
- [ ] Slot default content variations
- [ ] Props/attrs separation edge cases
- [ ] Circular dependency handling

**CLI:**
- [ ] Watch mode integration tests (if feasible)
- [ ] Frontmatter edge cases
- [ ] Data merging priority tests
- [ ] File system error handling

#### 2.3: Integration Tests

- [ ] End-to-end scenarios
- [ ] Multi-file project compilation
- [ ] Real-world component patterns

**Target:** 80%+ code coverage across both packages

---

### Phase 3: Documentation (1-2 weeks)

**Goal:** Complete, bilingual documentation

#### 3.1: Core Documentation

**Language Strategy:**
- Primary: English (for wider reach)
- Secondary: Japanese (for domestic users)
- Structure: English README with link to Japanese version

**Documents to Create:**

- [ ] **README.md** (English)
  - Project overview
  - Features
  - Installation
  - Quick start
  - Basic usage examples
  - AI-assisted development notice
  - Links to full documentation

- [ ] **README.ja.md** (Japanese)
  - Same structure as English version
  - Culturally appropriate examples

- [ ] **GETTING_STARTED.md**
  - Step-by-step tutorial
  - Building first component
  - Using slots
  - Data injection
  - Complete example project

- [ ] **API.md**
  - Complete API reference
  - Transform function options
  - Type definitions
  - Return values

- [ ] **COMPONENTS.md**
  - Component syntax guide
  - Props and attrs
  - Slot system
  - Best practices
  - Common patterns

- [ ] **CLI.md**
  - All CLI options explained
  - Usage examples
  - Watch mode guide
  - Frontmatter guide
  - Configuration tips

- [ ] **MIGRATION.md**
  - From vanilla Pug
  - Common pitfalls
  - Compatibility notes

- [ ] **CONTRIBUTING.md**
  - Development setup
  - Testing guidelines
  - Code style
  - Pull request process

#### 3.2: AI Development Notice

Add prominent notice in README:

```markdown
## 🤖 AI-Assisted Development

This project was developed with significant assistance from Claude (Anthropic).
The AI helped with:
- Architecture design and implementation
- Test suite development
- Documentation writing
- Code review and optimization

While AI-assisted, all code has been reviewed, tested, and validated by human developers.
```

#### 3.3: Code Examples

**Core Package (`pug-tail`):**
- [ ] Create `examples/` directory with programmatic usage
  ```
  examples/
  ├── basic-transform.js       # Simple transform() usage
  ├── with-components.js       # Component definition and usage
  ├── with-data.js            # Data injection
  └── README.md               # How to run examples
  ```

**CLI Package (`pug-tail-cli`):**
- [ ] Create `examples/` directory with real project examples
  ```
  examples/
  ├── basic/                  # Simple static site
  │   ├── src/
  │   │   ├── index.pug
  │   │   └── about.pug
  │   ├── dist/              # Generated output
  │   └── README.md          # How to build
  │
  ├── components/            # Component-based site
  │   ├── src/
  │   │   ├── components/
  │   │   │   ├── _layout.pug
  │   │   │   ├── _header.pug
  │   │   │   └── _card.pug
  │   │   ├── pages/
  │   │   │   ├── index.pug
  │   │   │   └── blog.pug
  │   │   └── data/
  │   │       └── site.json
  │   ├── package.json       # Build scripts
  │   └── README.md
  │
  ├── with-frontmatter/      # Using YAML frontmatter
  │   ├── src/
  │   │   ├── posts/
  │   │   │   ├── post-1.pug
  │   │   │   └── post-2.pug
  │   │   └── data/
  │   │       └── common.json
  │   └── README.md
  │
  ├── watch-mode/            # Development with watch
  │   ├── src/
  │   ├── package.json       # Scripts with -w flag
  │   └── README.md
  │
  └── README.md              # Examples overview
  ```

- [ ] Each example should be:
  - Self-contained (can copy-paste and run)
  - Well-commented
  - Include package.json with build scripts
  - Have its own README explaining the concept
  - Demonstrate one main feature clearly

---

### Phase 4: Quality Assurance (1 week)

**Goal:** Ensure stability and reliability

#### 4.1: Code Quality

- [ ] Run full lint: `npm run lint`
- [ ] Fix all linter warnings
- [ ] Run type check: `npm run type-check`
- [ ] Ensure no `any` types (except where necessary)

#### 4.2: Performance Testing

- [ ] Benchmark transformation speed
- [ ] Test with large files (1000+ lines)
- [ ] Test with many files (100+ components)
- [ ] Watch mode performance
- [ ] Memory usage analysis

#### 4.3: Compatibility Testing

- [ ] Test on Node.js LTS versions (18, 20, 22)
- [ ] Test on different operating systems (macOS, Linux, Windows)
- [ ] Browser compatibility (for generated HTML)

#### 4.4: Security Audit

- [ ] Run `npm audit`
- [ ] Review dependencies
- [ ] Check for known vulnerabilities
- [ ] Update vulnerable packages

---

### Phase 5: Pre-Release Preparation (3-5 days)

**Goal:** Prepare for npm publication

#### 5.1: Package Configuration

**Core Package (`pug-tail`):**
- [ ] Update `package.json`:
  ```json
  {
    "name": "pug-tail",
    "version": "1.0.0-alpha.1",
    "description": "A transpiler for component-based Pug templates with slot syntax",
    "keywords": ["pug", "template", "component", "slot", "transpiler"],
    "author": "Your Name",
    "license": "MIT",
    "repository": {
      "type": "git",
      "url": "https://github.com/yourusername/pug-tail.git",
      "directory": "packages/pug-tail"
    },
    "engines": {
      "node": ">=18.0.0"
    }
  }
  ```

- [ ] Configure `files` field (include only necessary files)
- [ ] Set up proper `exports`:
  ```json
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
  ```

**CLI Package (`pug-tail-cli`):**
- [ ] Similar configuration
- [ ] Define `bin` entry:
  ```json
  "bin": {
    "pug-tail": "./dist/cli.js"
  }
  ```

#### 5.2: Build Configuration

- [ ] Ensure clean build: `npm run build`
- [ ] Generate type definitions
- [ ] Test built packages locally
- [ ] Verify tree-shaking works

#### 5.3: Versioning

- [ ] Set initial version: `1.0.0-alpha.1`
- [ ] Prepare CHANGELOG.md:
  ```markdown
  # Changelog
  
  ## [1.0.0-alpha.1] - 2025-01-XX
  
  ### Initial Alpha Release
  
  #### Core Features
  - Component syntax with `component` keyword
  - Slot system with `slot` and `fill` directives
  - Props/attrs automatic separation
  - Automatic attribute fallthrough
  
  #### CLI Features
  - Multi-file/directory processing
  - Data injection via `-O` option
  - YAML frontmatter support
  - `@dataFiles` directive
  - Watch mode with dependency tracking
  - Doctype specification
  
  #### Known Limitations
  - This is an alpha release
  - API may change in future versions
  - Limited real-world testing
  ```

#### 5.4: Legal

- [ ] Add LICENSE file (MIT recommended)
- [ ] Review and update copyright notices
- [ ] Ensure all dependencies are compatible with chosen license

---

### Phase 6: Alpha Release (1 day)

**Goal:** Publish to npm

#### 6.1: Pre-publication Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] README includes installation instructions
- [ ] CHANGELOG.md updated
- [ ] Version numbers correct
- [ ] Git tags created

#### 6.2: Dry Run

```bash
# Test pack (don't publish yet)
cd packages/pug-tail
npm pack
cd ../pug-tail-cli
npm pack

# Inspect generated tarballs
tar -tzf pug-tail-1.0.0-alpha.1.tgz
tar -tzf pug-tail-cli-1.0.0-alpha.1.tgz
```

#### 6.3: Publication

```bash
# Publish core package first
cd packages/pug-tail
npm publish --tag alpha --access public

# Then publish CLI
cd ../pug-tail-cli
npm publish --tag alpha --access public
```

#### 6.4: Post-Publication

- [ ] Verify packages on npm
- [ ] Test installation: `npm install pug-tail@alpha`
- [ ] Test CLI installation: `npm install -g pug-tail-cli@alpha`
- [ ] Create GitHub release with notes
- [ ] Announce on social media (optional)

---

## 📊 Success Criteria

### Before Alpha Release

- [ ] Test coverage ≥ 80%
- [ ] All core tests passing (224+)
- [ ] Documentation complete (README, API, guides)
- [ ] No critical bugs identified
- [ ] Successfully used in at least one real project
- [ ] Clean npm audit (no high/critical vulnerabilities)

### Alpha Release Goals

- [ ] Successfully published to npm
- [ ] Installation works on all supported platforms
- [ ] CLI tool works globally
- [ ] Basic examples run without errors
- [ ] Community can provide feedback

---

## 🚨 Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes needed after alpha | High | Clearly mark as alpha, use semver properly |
| Performance issues in production | Medium | Benchmark before release, optimize hot paths |
| Compatibility issues | Medium | Test on multiple Node versions, document requirements |
| Documentation insufficient | Low | Get feedback from external users before stable release |
| Package split causes confusion | Low | Clear documentation, migration guide |

---

## 📝 Feedback Collection

### During Alpha Period

- [ ] Set up GitHub Issues templates
- [ ] Create discussion forum (GitHub Discussions)
- [ ] Collect user feedback
- [ ] Track common questions
- [ ] Monitor npm download stats

### Feedback Channels

1. **GitHub Issues**: Bug reports, feature requests
2. **GitHub Discussions**: Questions, usage examples
3. **npm feedback**: Package quality issues
4. **Personal testing**: Real-world usage notes

---

## 🔄 Post-Alpha Roadmap

### Configuration File Support (v1.0.0-beta.1)

**Goal:** Improve developer experience with configuration files

#### Implementation

- [ ] Support multiple config file formats:
  ```
  pug-tail.config.js      # JavaScript (recommended)
  pug-tail.config.mjs     # ES Module
  pug-tail.config.json    # JSON
  .pugtailrc              # JSON (short name)
  .pugtailrc.js           # JavaScript (short name)
  ```

- [ ] Configuration structure:
  ```javascript
  // pug-tail.config.js
  export default {
    // Input/Output
    input: 'src/**/*.pug',
    output: 'dist',
    extension: '.html',
    
    // Pug options
    basedir: 'src',
    doctype: 'html',
    pretty: true,
    
    // Data
    data: './data/site.json',
    
    // Watch options
    watch: {
      enabled: false,
      debounce: 100,
    },
    
    // Advanced
    ignore: ['**/_*.pug'],
    silent: false,
    debug: false,
  }
  ```

- [ ] Config file discovery:
  1. Check current directory
  2. Check parent directories (up to project root)
  3. Stop at package.json or git root

- [ ] CLI option to specify config:
  ```bash
  pug-tail --config custom.config.js
  ```

- [ ] Merge priority:
  ```
  CLI arguments > Config file > Defaults
  ```

- [ ] Config validation with helpful error messages

- [ ] Update documentation with config examples

**Benefits:**
- Cleaner command lines
- Easier to share project settings
- Better for CI/CD integration
- Consistent builds across team

**Note:** This is planned for beta, not alpha release.

---

### Beta Release (v1.0.0-beta.1)

- Address alpha feedback
- Stabilize API
- Additional real-world testing
- Performance optimization

### Stable Release (v1.0.0)

- API frozen
- Production-ready
- Complete documentation
- Migration paths documented
- Community contributions welcome

---

## 📚 Additional Resources

### Useful Links

- npm publishing guide: https://docs.npmjs.com/cli/v10/commands/npm-publish
- Semantic versioning: https://semver.org/
- Conventional Commits: https://www.conventionalcommits.org/
- Keep a Changelog: https://keepachangelog.com/

### Tools

- `npm pack` - Test package without publishing
- `npm version` - Bump version numbers
- `npm deprecate` - Mark versions as deprecated if needed
- `npm unpublish` - Remove within 72 hours (use sparingly)

---

## ✅ Current Status

- [x] Phase 0: Starting real-world testing
- [ ] Phase 1: Package restructuring
- [ ] Phase 2: Test coverage enhancement
- [ ] Phase 3: Documentation
- [ ] Phase 4: Quality assurance
- [ ] Phase 5: Pre-release preparation
- [ ] Phase 6: Alpha release

**Last Updated:** 2025-01-02
