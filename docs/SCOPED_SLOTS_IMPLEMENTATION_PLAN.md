# Scoped Slots Implementation Plan

## Overview

Scoped Slots allow child components to pass variables to parent components. This enables child components to hold data while parents determine how to display it.

## Goals

- Implement scoped slot functionality similar to Vue.js/Svelte
- Maintain consistency with existing Scope Isolation feature
- Provide intuitive Pug-like syntax
- Enhance error messages and improve DX

## Non-Goals (Phase 1)

- Nested scoped slots
- Dynamic slot names
- Default values for slot scope variables

## Use Cases

### Use Case 1: Customizable List Display

**Child Component (List)**: Holds data
**Parent**: Determines how to display data

```pug
// Child component definition
component List()
  - const { items } = $props
  ul
    each item, index in items
      li
        slot(default item=item index=index)
          // Default display
          span= item

// Parent usage (custom display)
- const todos = ['Buy milk', 'Write code', 'Sleep']

List(items=todos)
  slot(default item index)
    .todo-item
      span.index= index + 1
      strong= item
```

### Use Case 2: Table Row Customization

```pug
component Table()
  - const { data } = $props
  table
    each row in data
      tr
        slot(row row=row)
          td= JSON.stringify(row)

- const users = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]

Table(data=users)
  slot(row row)
    td= row.name
    td= row.age
    td
      button Edit
```

### Use Case 3: Customizable Card

```pug
component Card()
  - const { title, status } = $props
  .card
    .card-header
      slot(header title=title status=status)
        h2= title
    .card-body
      slot(default)

Card(title="User Profile" status="active")
  slot(header title status)
    h2(class=status === 'active' ? 'text-green' : 'text-gray')= title
    span.badge= status
  slot(default)
    p User details here
```

## Syntax Design

### Basic Syntax

#### Slot Definition (Child Component)

```pug
component MyComponent()
  slot(slotName var1=value1 var2=value2)
    // Default content
```

**Rules:**
- First positional argument (value only) = slot name
- Named arguments (`key=value` format) = scope variables
- `name` attribute = explicit slot name (highest priority)

#### Slot Usage (Parent Component)

```pug
MyComponent()
  slot(slotName var1 var2)
    // var1, var2 are available
    p= var1
```

**Rules:**
- First positional argument = slot name
- Subsequent positional arguments = list of variable names to receive
- Order must match the definition

### Disambiguating Syntax

#### Case 1: Default Slot (No Name)

```pug
// Definition
slot(item=item)  // No name = "default"

// Usage
slot(default item)  // Explicitly specify "default"
// or
slot(item)  // If first arg is only variable name, interpreted as default
```

#### Case 2: Named Slot

```pug
// Definition
slot(header title=title)  // First positional arg = slot name

// Usage
slot(header title)  // First is header, next is variable
```

#### Case 3: Explicit name Attribute

```pug
// Definition
slot(name="header" title=title status=status)

// Usage
slot(header title status)
```

### Parsing Rules (Priority)

1. **If `name` attribute exists**: Use it as slot name
2. **Mixed positional and named arguments**:
   - First positional argument (value only) → slot name
   - Named arguments (`key=value`) → scope variables
3. **Positional arguments only (usage side)**:
   - First argument → slot name
   - Subsequent arguments → variable names to receive

## Technical Design

### AST Structure Changes

#### SlotDefinition Extension

```typescript
interface SlotDefinition {
  name: string
  placeholder: Tag | null
  location: NodeLocation
  // New addition
  scopeVariables?: Map<string, string>  // variableName -> expression
}
```

**Example:**
```pug
slot(header title=title count=items.length)
```
↓
```typescript
{
  name: 'header',
  scopeVariables: new Map([
    ['title', 'title'],
    ['count', 'items.length']
  ])
}
```

#### SlotProvision Extension

Store list of variables received on the slot usage side:

```typescript
interface SlotProvision {
  name: string
  content: Block
  location: NodeLocation
  // New addition
  receivedVariables?: string[]  // List of variable names to receive
}
```

**Example:**
```pug
slot(header title count)
```
↓
```typescript
{
  name: 'header',
  receivedVariables: ['title', 'count']
}
```

### Scope Variable Propagation

Scope variable propagation mechanism:

```
1. Component definition:
   Detect slot(header title=title)
   → Save { title: 'title' } to SlotDefinition.scopeVariables

2. Component invocation:
   Detect slot(header title)
   → Save ['title'] to SlotProvision.receivedVariables

3. Slot replacement:
   - Get variable expression from SlotDefinition.scopeVariables
   - Insert variable declaration code before SlotProvision.content
   - const title = <evaluated expression>
```

### Code Generation Strategy

#### Generated Code

**Input:**
```pug
component List()
  - const { items } = $props
  ul
    each item, index in items
      li
        slot(default item=item index=index)

List(items=todos)
  slot(default item index)
    span= item
    span= index
```

**Generated Pug AST (Conceptual):**
```pug
ul
  each item, index in items
    li
      // Insert scope variable declarations
      - const __slot_item = item
      - const __slot_index = index
      // Slot content
      span= __slot_item
      span= __slot_index
```

**Important**: To avoid variable name collisions, internally use `__slot_` prefix and map to original variable names within slot content.

### Integration with Scope Isolation

Variables received from scoped slots must be allowed by Scope Isolation.

#### Using ScopeAnalysisResult

```typescript
interface ScopeAnalysisResult {
  // ...
  slotVariables: Set<string>  // Variables received from slots
}
```

#### Analysis Flow

1. **Analyze slot usage side**:
   ```pug
   slot(default item index)
     p= item  // item is registered as slotVariable
   ```
   → Add `item`, `index` to `slotVariables`

2. **Scope Isolation check**:
   ```typescript
   function isAllowedIdentifier(name: string, scopeAnalysis: ScopeAnalysisResult): boolean {
     return (
       ALLOWED_GLOBALS.has(name) ||
       scopeAnalysis.declaredVariables.has(name) ||
       scopeAnalysis.propsVariables.has(name) ||
       scopeAnalysis.attrsVariables.has(name) ||
       scopeAnalysis.slotVariables.has(name) ||  // ✓ Allow slot variables
       // ...
     )
   }
   ```

## Implementation Phases

### Phase 1: Basic Scoped Slot (Default Slot Only)

**Goal**: Enable passing scope variables through unnamed slot (default)

**Tasks**:
1. Extend SlotDefinition/SlotProvision
2. Implement parser for slot definition side
   - Parse `slot(item=item index=index)`
3. Implement parser for slot usage side
   - Parse `slot(default item index)`
4. Insert variable declarations in ASTTransformer
5. Basic tests

**Success Criteria**:
```pug
component List()
  - const items = ['a', 'b', 'c']
  each item in items
    slot(default item=item)

List()
  slot(default item)
    p= item
```
→ HTML is generated correctly

### Phase 2: Named Slot Support

**Goal**: Enable scope variables for named slots as well

**Tasks**:
1. Parse named slot syntax
   - `slot(header title=title)` 
   - `slot(header title)`
2. Variable management across multiple slots
3. Add tests

**Success Criteria**:
```pug
component Card()
  slot(header title="Hello")
  slot(body content="World")

Card()
  slot(header title)
    h1= title
  slot(body content)
    p= content
```

### Phase 3: Integration with Scope Isolation

**Goal**: Handle slot variables correctly in Scope Isolation

**Tasks**:
1. Variable analysis within slot content
2. Register to `slotVariables`
3. Integration with Scope Isolation tests
4. Improve error messages

**Success Criteria**:
- Variables received from slots are not treated as external variables
- Error when using variables not declared in slot

```pug
List()
  slot(default item)
    p= item        // ✓ OK
    p= otherVar    // ✗ Error: external variable
```

### Phase 4: Advanced Features and Error Handling

**Goal**: Edge cases and error handling

**Tasks**:
1. Detect variable order mismatch
   ```pug
   // Definition: slot(item=item index=index)
   // Usage: slot(index item)  // Wrong order → Error or warning
   ```
2. Detect undefined slot variables
   ```pug
   // Definition: slot(item=item)
   // Usage: slot(item index)  // index not defined → Error
   ```
3. Detect variable name collisions
4. Consider default value support
5. Comprehensive error messages

### Phase 5: Documentation and Examples

**Goal**: User-facing documentation

**Tasks**:
1. Add section to README.md
2. Document in CONFIGURATION.md (no configuration needed but feature explanation)
3. Add sample code (examples/)
4. Migration guide (from existing slots)

## Error Handling

### Error 1: Slot Variable Mismatch

```pug
component List()
  slot(default item=item)  // Only item defined

List()
  slot(default item index)  // index is undefined
    p= item
    p= index
```

**Error Message**:
```
Error: Slot "default" provides variable "index" but it's not defined in component
  Available variables: item

Hint: Check the component definition and ensure all variables are provided.
```

### Error 2: Slot Variable Order Mismatch

```pug
component List()
  slot(default item=item index=index)

List()
  slot(default index item)  // Wrong order
```

**Warning Message** (Allow in strict mode but warn):
```
Warning: Slot variable order mismatch
  Expected: item, index
  Received: index, item

Hint: Consider using the same order for better readability.
```

### Error 3: External Variable Access in Scope

```pug
List()
  slot(default item)
    p= item        // ✓ OK
    p= externalVar // ✗ Error
```

**Error Message**:
```
Error: Slot content references external variable "externalVar" at line X

Hint: Slot content can only access:
- Variables provided by the slot: item
- Variables declared within the slot content
- Standard JavaScript globals

Suggestions:
1. Pass via slot variables in component definition
2. Declare inside slot content
```

## Testing Strategy

### Unit Tests

1. **SlotDefinition Parsing**
   - `slot(item=item)` → Extract scopeVariables correctly
   - `slot(header title=title status=status)` → Multiple variables

2. **SlotProvision Parsing**
   - `slot(default item)` → Extract receivedVariables correctly
   - `slot(header title status)` → Multiple variables

3. **Variable Injection**
   - Variable declarations inserted before slot content
   - Variable name collisions avoided

### Integration Tests

1. **Basic Scoped Slot**
   - Variable passing through default slot
   - HTML generated correctly

2. **Named Scoped Slots**
   - Multiple named slots
   - Each passing different variables

3. **Scope Isolation Integration**
   - Slot variables not treated as external variables
   - Variables outside slots are detected

4. **Error Cases**
   - Undefined variable errors
   - Order mismatch warnings
   - External variable access errors

### E2E Tests

Test real use cases:
- Todo list (customizable item display)
- User table (customizable row display)
- Card (different variables for header and body)

## Performance Considerations

### Variable Declaration Overhead

Since variable declaration code is inserted for each slot expansion, code size increases with many slots.

**Mitigation**:
- Don't create unnecessary intermediate variables
- Evaluate expressions directly when possible

**Before (Inefficient)**:
```pug
- const __slot_item = item
- const __slot_index = index
p= __slot_item
p= __slot_index
```

**After (Optimized)**:
```pug
p= item
p= index
```

Insert declaration code only when variable remapping is necessary.

### Memory Usage

Holding scopeVariables in SlotDefinition slightly increases memory usage.

**Mitigation**: Keep undefined when no variables are defined (don't create Map)

## Alternatives Considered

### Alternative 1: Argument List Format

```pug
// Definition side
slot(default, item, index)
  
// Usage side
slot(default) |item, index|
  p= item
```

**Rejected**: Deviates too much from Pug syntax

### Alternative 2: Special Attributes

```pug
// Definition side
slot(default data-scope-item=item data-scope-index=index)

// Usage side
slot(default scope="item, index")
```

**Rejected**: Verbose and not intuitive

### Alternative 3: Current Proposal (Adopted)

```pug
// Definition side
slot(default item=item index=index)

// Usage side
slot(default item index)
```

**Pros**:
- Close to existing Pug syntax
- Concise and readable
- Clear distinction between named and positional arguments

## Open Questions

### Q1: Should Variable Order Be Enforced?

**Option A**: Enforce order (error)
```pug
slot(default item index)  // Only allow same order as definition
```

**Option B**: Warning only for order
```pug
slot(default index item)  // Allow with warning
```

**Recommendation**: Option B (warning only). Maintain flexibility while promoting best practices.

### Q2: Should Default Values Be Supported?

```pug
// Specify default values on usage side?
slot(default item="No item" index=0)
```

**Recommendation**: Not needed for Phase 1. Consider as future enhancement.

### Q3: Should Destructuring Be Supported?

```pug
// Definition side
slot(default user=user)

// Destructuring on usage side?
slot(default { name, age })
  p= name
  p= age
```

**Recommendation**: Not needed for Phase 1. Fully supporting JavaScript destructuring syntax is too complex.

## Success Metrics

Success criteria upon completion:

1. **Functional Success**:
   - [ ] Scope variables work with default slot
   - [ ] Scope variables work with named slots
   - [ ] Correctly integrated with Scope Isolation
   - [ ] Clear error messages

2. **Test Success**:
   - [ ] Unit tests: 20+ tests
   - [ ] Integration tests: 10+ tests
   - [ ] E2E tests: 3+ real-world scenarios
   - [ ] All tests passing

3. **Documentation**:
   - [ ] Usage examples in README.md
   - [ ] Implementation documentation
   - [ ] Sample code (examples/)

4. **Quality**:
   - [ ] No TypeScript type errors
   - [ ] Biome lint passing
   - [ ] Minimal performance impact

## Timeline

| Phase | Estimated Time | Priority |
|-------|----------------|----------|
| Phase 1: Basic Scoped Slot | 2-3 days | High |
| Phase 2: Named Slots | 1-2 days | High |
| Phase 3: Scope Isolation | 1-2 days | High |
| Phase 4: Error Handling | 2-3 days | Medium |
| Phase 5: Documentation | 1 day | Medium |

**Total**: Approximately 1-2 weeks

## References

- [Vue.js Scoped Slots](https://vuejs.org/guide/components/slots.html#scoped-slots)
- [Svelte Slot Props](https://svelte.dev/docs#template-syntax-slot-slot-key-value)


---

**Status**: 📋 Planning Phase


