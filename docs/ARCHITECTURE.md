# Architecture

This document describes the internal architecture and processing flow of pug-tail.

## Overview

pug-tail is a build-time transformer that extends Pug with Vue/Svelte-style component syntax. It operates entirely at the AST level, transforming component DSL into pure Pug AST before Pug's code generation phase.

## Processing Flow

```
Pug Source (with component DSL)
    ↓
Lexer (pug-lexer)
    ↓
Parser (pug-parser)
    ↓
Pug AST
    ↓
Component Registry ← Detect and register component definitions
    ↓
AST Transformer   ← Inline expand component calls
    ↓             ← Replace slots with actual content
    ↓             ← Apply attribute categorization ($props/$attrs)
    ↓             ← Handle attribute fallthrough
    ↓             ← Validate scope isolation
Pure Pug AST (no component/slot nodes)
    ↓
Code Gen (pug-code-gen)
    ↓
HTML
```

## Core Modules

### 1. Component Registry (`src/core/componentRegistry.ts`)

**Purpose**: Detect and store component definitions from the AST.

**Key responsibilities**:
- Scan AST for `component` directives
- Extract component name, parameters, and body
- Store component definitions in a registry for later use
- Detect duplicate component definitions

**Example**:
```pug
component Card()
  .card
    slot(header)
    slot(body)
```

Registry stores:
- Name: `Card`
- Parameters: `[]`
- Body: AST nodes representing `.card` structure
- Slot information: `header`, `body`

### 2. AST Transformer (`src/core/astTransformer.ts`)

**Purpose**: The main transformation engine that processes component calls and slots.

**Key responsibilities**:
- Detect component calls (uppercase function calls like `Card()`)
- Inline expand component bodies at call sites
- Replace slot placeholders with actual content
- Apply attribute categorization and fallthrough
- Validate scope isolation
- Clean up temporary nodes

**Transformation phases**:

#### Phase 1: Component Detection and Expansion
```pug
// Input
Card(title="Hello")
  slot(body)
    p Content

// Intermediate (after expansion)
- const $props = { title: "Hello" }
- const $attrs = {}
.card
  slot(header)  // Default slot content
  slot(body)    // Will be replaced
```

#### Phase 2: Slot Resolution
```pug
// After slot replacement
- const $props = { title: "Hello" }
- const $attrs = {}
.card
  // Default header
  p Content  // Replaced slot(body)
```

#### Phase 3: Attribute Categorization
- Analyze `$props` destructuring to determine declared properties
- Categorize component arguments into `$props` and `$attrs`
- Generate appropriate JavaScript variable declarations

#### Phase 4: Attribute Fallthrough
- Detect root elements in component body
- Apply automatic attribute fallthrough if no manual `&attributes()` is used
- Merge classes properly

### 3. Slot Resolver (`src/core/slotResolver.ts`)

**Purpose**: Handle slot replacement logic.

**Key responsibilities**:
- Match slot names between definition and usage
- Replace slot placeholders with actual content
- Handle default slot content when no match is found
- Support nested slots

**Algorithm**:
1. Extract slot definitions from component body
2. Extract slot content from component call
3. For each slot in definition:
   - Find matching slot in call
   - Replace with matched content, or use default

### 4. Error Handler (`src/core/errorHandler.ts`)

**Purpose**: Provide user-friendly error messages.

**Key responsibilities**:
- Format error messages with context
- Include file locations when available
- Suggest fixes for common mistakes
- Handle compilation errors gracefully

## Utility Modules

### Attribute Categorizer (`src/utils/attributeCategorizer.ts`)

Analyzes component code to determine how arguments should be split between `$props` and `$attrs`.

**Process**:
1. Parse component body looking for `$props` destructuring
2. Extract declared property names
3. Categorize component arguments accordingly
4. Handle default values and renaming

### Scope Analyzer (`src/utils/scopeAnalyzer.ts`)

Validates component scope isolation.

**Process**:
1. Collect variable declarations within component
2. Detect external variable references
3. Check against allowed globals (Math, console, etc.)
4. Report violations based on validation mode (error/warn/off)

### AST Helpers (`src/utils/astHelpers.ts`)

Common utilities for working with Pug AST nodes:
- `isTag(node)` - Check if node is a tag
- `isCode(node)` - Check if node is a code block
- `isComponentCall(node)` - Detect component calls
- `isSlotTag(node)` - Detect slot tags
- `cloneNode(node)` - Deep clone AST nodes

## Design Principles

### 1. Zero Runtime Cost

All component and slot concepts are completely eliminated at build time. The final output is pure Pug AST that Pug's standard compiler processes normally.

**Benefits**:
- No runtime library required
- No performance overhead
- Full compatibility with existing Pug tooling

### 2. AST-Level Transformation

Rather than string manipulation or runtime interpretation, pug-tail works directly with Pug's AST.

**Benefits**:
- Preserves source locations for error reporting
- Integrates seamlessly with Pug's compilation pipeline
- Enables sophisticated transformations (scope analysis, attribute categorization)

### 3. Non-Invasive Integration

pug-tail doesn't modify Pug's runtime or behavior.

**Benefits**:
- Can be added/removed from projects easily
- No conflicts with Pug updates
- Works with all Pug features (includes, extends, mixins, etc.)

### 4. Type Safety

Written in TypeScript with comprehensive type definitions for all AST nodes and transformation steps.

## CLI Architecture

### File Processor (`src/cli/fileProcessor.ts`)

Handles individual file compilation:
- Read source files
- Apply transformations
- Write output files
- Track dependencies

### Dependency Tracker (`src/cli/dependencyTracker.ts`)

Manages file dependencies for watch mode:
- Track which files include which components
- Invalidate dependent files when components change
- Rebuild dependency graph efficiently

### Watcher (`src/cli/watcher.ts`)

Monitors file changes:
- Watch source directories
- Debounce rapid changes
- Trigger incremental rebuilds
- Track component dependencies

### Data Loader (`src/cli/dataLoader.ts`)

Handles data file loading:
- Support JSON and YAML formats
- Merge global and per-page data
- Resolve data file paths relative to config/entry files

## Testing Strategy

### Unit Tests (`tests/unit/`)

Test individual modules in isolation:
- AST helpers
- Component detection
- Slot resolution
- Attribute categorization
- Scope analysis

### Integration Tests (`tests/integration/`)

Test complete transformation scenarios:
- Component definitions and calls
- Slot replacement
- Props/attrs separation
- Attribute fallthrough
- Scope isolation

### E2E Tests (`tests/e2e/`)

Test CLI functionality:
- File processing
- Watch mode
- Config file loading
- Error handling

## Performance Considerations

### Component Registry Caching

Component definitions are cached after first parse to avoid redundant AST traversal.

### Incremental Compilation

Watch mode only recompiles changed files and their dependents, not the entire project.

### AST Reuse

Original AST nodes are cloned rather than re-parsed when components are reused multiple times.

## Extension Points

The architecture is designed to be extensible:

### Custom Validators

Add new scope isolation validators:
```typescript
registerValidator('customRule', (node, context) => {
  // Custom validation logic
})
```

### Custom Transformers

Add post-processing transformations:
```typescript
registerTransformer('customTransform', (ast, options) => {
  // Custom AST transformation
})
```

## Future Architecture Plans

### Scoped Slots

Support passing data from component to slot content:
```pug
component List()
  each item in items
    slot(item, data=item)

List(items=data)
  slot(item)
    p= data.name  // Access passed data
```

### Property Shorthand

Simplify prop passing:
```pug
- const title = "Hello"
Card(title)  // Instead of Card(title=title)
```

### Component Imports

Import components from other files:
```pug
import Card from './Card.pug'

Card(title="Hello")
```

## Debugging

Enable debug mode for detailed transformation logs:
```javascript
// pugtail.config.js
export default {
  debug: true
}
```

Debug output includes:
- Component registry state
- AST before/after transformation
- Attribute categorization results
- Scope analysis reports
