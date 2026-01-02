# Test Fixtures

This directory contains test fixtures organized by feature/functionality.

## Directory Structure

```
fixtures/
├── components/         # Basic component transformation
├── slots/             # Slot system (named, default, nested)
├── attributes/        # Attribute handling (Phase 2)
├── props-attrs/       # Props/attrs separation (Phase 3)
├── nested/            # Nested component calls
├── complex/           # Complex multi-component structures
├── edge-cases/        # Edge cases and unusual scenarios
└── include/           # Include and extends functionality
```

## Fixture Format

Each fixture consists of:
- `*.pug` - Input Pug template
- `*.html` - Expected HTML output

## Adding New Fixtures

1. Choose the appropriate directory based on the feature being tested
2. Create both `.pug` and `.html` files with the same base name
3. Add corresponding test cases in `tests/integration/`

## Test Organization

Integration tests are organized by feature:
- `components.test.ts` - Basic component transformation
- `slots.test.ts` - Slot system
- `attributes.test.ts` - Attribute handling (Phase 2)
- `props-attrs.test.ts` - Props/attrs separation (Phase 3)
- `nested-components.test.ts` - Nested components
- `edge-cases.test.ts` - Edge cases
- `include.test.ts` - Include and extends

