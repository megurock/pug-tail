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
Transformer Pipeline:
  1. ComponentDetectorVisitor  ← Detect and register component definitions
  2. ComponentExpanderVisitor  ← Inline expand component calls
                               ← Replace slots with actual content
                               ← Apply attribute categorization ($props/$attrs)
                               ← Handle attribute fallthrough
  3. DefinitionRemoverVisitor  ← Remove component definitions
  4. IncludeFlattenerVisitor   ← Flatten Include/Extends nodes
    ↓
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

### 2. Transformation Pipeline (Visitor Pattern)

**Purpose**: The main transformation engine using the visitor pattern.

**Architecture**: Following [the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler) principles, pug-tail uses a visitor-based architecture where each transformation pass is a separate visitor.

**Key components**:

#### Traverser (`src/core/compiler/traverser.ts`)
Generic AST traversal engine that visits each node and calls visitor methods.

- Depth-first traversal of the AST
- Supports enter/exit hooks for each node type
- Handles node replacement and removal
- Works with all Pug node types

#### Transformer (`src/core/compiler/transformer.ts`)
Orchestrates the visitor pipeline.

**Pipeline stages**:
1. **ComponentDetectorVisitor** - Detect and register components
2. **ComponentExpanderVisitor** - Expand component calls
3. **DefinitionRemoverVisitor** - Remove component definitions
4. **IncludeFlattenerVisitor** - Flatten includes/extends

**Example**:
```typescript
const transformer = new Transformer(registry, errorHandler, options)
const transformedAst = transformer.transform(ast)
```

#### ComponentDetectorVisitor (`src/core/visitors/componentDetector.ts`)
**Detects and registers component definitions**

**Key responsibilities**:
- Find `component` tags in the AST
- Extract component metadata (name, slots, body)
- Analyze usage patterns ($props/$attrs)
- Validate scope isolation
- Register with ComponentRegistry
- Handle Include/Extends recursively

**Example transformation**:
```pug
// Input
component Card()
  .card
    slot(header)
    slot(body)

// Registry stores:
// - Name: "Card"
// - Slots: ["header", "body"]
// - Body: AST of .card structure
```

#### ComponentExpanderVisitor (`src/core/visitors/componentExpander.ts`)
**Expands component calls by inlining their bodies**

**Key responsibilities**:
- Detect component calls (capitalized tags)
- Clone component body
- Extract provided slots
- Inject attributes ($props/$attrs)
- Replace slot definitions with provided content
- Detect recursive calls
- Handle nested component calls

**Transformation phases**:

**Phase 1: Component Call Detection**
```pug
// Input
Card(title="Hello")
  slot(body)
    p Content

// Detected: Card is a component call
```

**Phase 2: Body Cloning and Injection**
```pug
// After cloning and attribute injection
{
  - const $props = { title: "Hello" }
  - const $attrs = {}
  .card
    slot(header)  // Default
    slot(body)    // To be replaced
}
```

**Phase 3: Slot Replacement**
```pug
// Final result
{
  - const $props = { title: "Hello" }
  - const $attrs = {}
  .card
    // header slot uses default
    p Content  // body slot replaced
}
```

#### DefinitionRemoverVisitor (`src/core/visitors/definitionRemover.ts`)
**Removes component definition nodes**

**Key responsibilities**:
- Identify `component` tags
- Remove them from the AST
- Clean up null nodes from blocks

**Example**:
```pug
// Before
component Card()
  .card

Card()

// After (component definition removed)
Card()  // Will be expanded
```

#### IncludeFlattenerVisitor (`src/core/visitors/includeFlattener.ts`)
**Flattens Include and Extends nodes**

**Key responsibilities**:
- Replace Include nodes with their content
- Replace Extends nodes with their content
- Handle nested includes

**Why needed**: pug-code-gen doesn't support Include/Extends nodes, so they must be flattened before code generation.

**Example**:
```pug
// Before
include components.pug  // Contains Card component
Card()

// After
// (components.pug content inlined)
component Card()
  .card
Card()
```

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
  - const { items = [] } = $props
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
