# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.0] - 2026-01-10

### Added

- Initial release
- Component system with multiple named slots (Vue/Svelte-like syntax)
- Props/attrs separation (Vue 3-style)
- Zero runtime cost - fully expanded at build time
- Works with standard Pug features (includes, extends, mixins, etc.)
- Programmatic API (`transform()` function)
- CLI tool with watch mode support
- Data file loading system (`$dataFiles` directive)
- Scope isolation validation
- TypeScript type definitions
- Comprehensive test suite

### Features

- **Component Definition**: Define reusable components with `component` keyword
- **Named Slots**: Multiple named slots with default content support
- **Props/Attrs Separation**: Clear separation of props and attrs (Vue 3-style with `$props`/`$attrs`)
- **Attrs Inheritance**: Automatic attribute passthrough with `&attributes()`
- **Control Flow**: Pug control structures (if/unless/each/while/case) work seamlessly in components
- **Dynamic Data**: Pass external data (from CLI, config, or frontmatter) as component attributes
- **Nested Components**: Components can use other components
- **Scope Isolation**: Component scope validation with configurable modes (error/warn/off)
- **Watch Mode**: CLI supports file watching for development
- **Error Handling**: Detailed error messages with file locations

[0.1.0-alpha.0]: https://github.com/megurock/pug-tail/releases/tag/v0.1.0-alpha.0
