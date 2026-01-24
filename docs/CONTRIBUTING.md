# Contributing to pug-tail

Thank you for your interest in contributing to pug-tail! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/pug-tail.git
cd pug-tail

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Project Structure

```
pug-tail/
├── src/                   # Source code
│   ├── cli.ts             # CLI entry point
│   ├── index.ts           # Programmatic API entry point
│   ├── transform.ts       # Main transform function
│   ├── cli/               # CLI-specific modules
│   │   ├── dataLoader.ts
│   │   ├── dependencyTracker.ts
│   │   ├── fileProcessor.ts
│   │   ├── pathResolver.ts
│   │   └── watcher.ts
│   ├── core/              # Core transformation logic
│   │   ├── compiler/      # Visitor pattern infrastructure
│   │   │   ├── traverser.ts       # Generic AST traversal
│   │   │   ├── transformer.ts     # Pipeline orchestrator
│   │   │   └── index.ts
│   │   ├── visitors/      # Visitor implementations
│   │   │   ├── visitor.ts             # Visitor interface
│   │   │   ├── componentDetector.ts   # Component detection
│   │   │   ├── componentExpander.ts   # Component expansion
│   │   │   ├── definitionRemover.ts   # Cleanup
│   │   │   ├── includeFlattener.ts    # Include/Extends flattening
│   │   │   └── index.ts
│   │   ├── componentRegistry.ts
│   │   ├── errorHandler.ts
│   │   └── slotResolver.ts
│   ├── types/             # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── modules.d.ts
│   │   └── pug.d.ts
│   └── utils/             # Utility functions
│       ├── astHelpers.ts
│       ├── attributeCategorizer.ts
│       ├── componentDetector.ts
│       ├── dataFilesDetector.ts
│       ├── scopeAnalyzer.ts
│       └── attributes/   # Attribute handling utilities
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   │   └── visitors/     # Visitor unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # End-to-end tests
│   ├── fixtures/         # Test fixtures
│   └── helpers/          # Test helpers
├── examples/             # Example projects
└── docs/                 # Documentation
    └── refactoring/      # Refactoring documentation
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

Write your code following the project's coding standards (see below).

### 3. Write Tests

All new features and bug fixes should include tests:

```bash
# Run tests in watch mode during development
npm test -- --watch

# Run specific test file
npm test -- tests/unit/astHelpers.test.ts
```

### 4. Lint and Format

```bash
# Run all checks (lint + format + type check)
npm run check

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### 5. Build

```bash
npm run build
```

### 6. Commit

We use conventional commits. Format your commit messages as:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(core): add support for nested slots
fix(cli): resolve basedir paths correctly
docs: update component DSL documentation
test(integration): add fallthrough test cases
```

### 7. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Avoid `any` type; use proper types or `unknown`
- Use descriptive variable and function names
- Add JSDoc comments for public APIs

**Example**:
```typescript
/**
 * Transforms a component call into its expanded form
 * @param node - The component call node
 * @param registry - The component registry
 * @returns The expanded AST nodes
 */
export function expandComponent(
  node: ComponentCallNode,
  registry: ComponentRegistry,
): Node[] {
  const component = registry.get(node.name)
  if (!component) {
    throw new Error(`Component "${node.name}" not found`)
  }
  
  // Implementation...
}
```

### Naming Conventions

- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` for true constants, `camelCase` for const bindings
- **Functions**: `camelCase`, use verbs (e.g., `transformNode`, `isComponent`)
- **Classes**: `PascalCase`
- **Interfaces/Types**: `PascalCase`
- **Boolean variables**: Prefix with `is`, `has`, `can`, `should`, `will`
- **Event handlers**: Prefix with `on` (e.g., `onFileChange`)

### File Organization

- One main export per file when possible
- Group related utilities in subdirectories
- Keep files focused and reasonably sized (< 500 lines)
- Export public APIs from `index.ts` files

### Error Handling

- Use `ErrorHandler` class for user-facing errors
- Provide helpful error messages with context
- Include file locations when available
- Suggest solutions for common mistakes

**Example**:
```typescript
throw new ErrorHandler(
  `Component "${name}" references external variable "${varName}"`,
  {
    hint: `Pass the variable via props: ${name}(${varName}=${varName})`,
    location: node.line,
  }
)
```

### Testing

#### Test Structure

```typescript
import { describe, expect, test } from 'vitest'

describe('Feature Name', () => {
  test('should do something specific', () => {
    // Arrange
    const input = '...'
    
    // Act
    const result = transform(input)
    
    // Assert
    expect(result).toBe('...')
  })
  
  test('should handle edge case', () => {
    // ...
  })
})
```

#### Test Naming

- Use descriptive test names starting with "should"
- Group related tests with `describe`
- Test both happy paths and error cases

#### Test Fixtures

- Store complex test cases in `tests/fixtures/`
- Use the `loadFixture` helper to load test files
- Keep fixtures focused on specific features

**Example**:
```
tests/fixtures/
├── components/
│   ├── basic.pug           # Basic component test
│   └── basic.html          # Expected output
├── slots/
│   ├── default-slot.pug
│   └── default-slot.html
```

## Adding New Features

### 1. Discuss First

For major features, open an issue first to discuss the approach.

### 2. Write Tests First (TDD)

Consider writing tests before implementation:

1. Write failing tests for the new feature
2. Implement the feature
3. Ensure tests pass

### 3. Update Documentation

- Update README if adding user-facing features
- Add examples to `examples/` directory
- Update `docs/COMPONENTS.md` for component DSL changes
- Update `docs/ARCHITECTURE.md` for internal changes

### 4. Consider Backward Compatibility

- Avoid breaking changes when possible
- If breaking changes are necessary, document them clearly
- Provide migration guides

## Common Tasks

### Adding a New AST Node Type

1. Define type in `src/types/pug.d.ts`
2. Add helper functions in `src/utils/astHelpers.ts`
3. Update transformer in `src/core/astTransformer.ts`
4. Add tests

### Adding a New CLI Option

1. Update CLI parser in `src/cli.ts`
2. Update config types in `src/types/index.ts`
3. Update `docs/CONFIGURATION.md`
4. Add tests in `tests/e2e/cli.test.ts`

### Adding a New Validation Rule

1. Add validator in `src/utils/scopeAnalyzer.ts`
2. Add configuration option if needed
3. Update error messages
4. Add tests in `tests/unit/scopeAnalyzer.test.ts`

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit: `chore: release v0.x.x`
4. Create git tag: `git tag v0.x.x`
5. Push: `git push && git push --tags`
6. Publish to npm: `npm publish`
7. Create GitHub release with changelog

## Getting Help

- Open an issue for bugs or feature requests
- Ask questions in discussions
- Check existing documentation in `docs/`
- Review test files for usage examples

## Code of Conduct

### Be Respectful

- Treat everyone with respect
- Be open to feedback
- Assume good intentions

### Be Constructive

- Provide helpful feedback
- Explain your reasoning
- Suggest improvements

### Be Professional

- Keep discussions focused on technical topics
- Avoid personal attacks
- Maintain a welcoming environment

## MVP Scope

### ✅ Implemented

**Core Features**:
- Component definitions with multiple named slots
- Component calls and slot resolution
- Props/attrs separation (`$props`/`$attrs`)
- Automatic attribute fallthrough
- Scope isolation validation
- Default values and renaming

**CLI Features**:
- File/directory compilation
- Watch mode
- Configuration files
- Data file loading (`--obj` and `$dataFiles`)
- Error reporting

### 🚧 Future Features

**Planned**:
- Scoped slots: Pass data from component to slots
- Better TypeScript integration

## Questions?

Feel free to open an issue or discussion if you have any questions about contributing!

---

Thank you for contributing to pug-tail! 🎉
