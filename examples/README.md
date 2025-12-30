# PugTail Examples

This directory contains demo pages where you can experience the features of PugTail.

## 🚀 Build and Run

```bash
# From the project root
npm run pug-tail:build

# Check the generated HTML
open examples/compiled/index.html
```

## 📄 Demo Pages

### 1. **index.html** - Main Demo Page
A landing page that introduces the overview and main features of PugTail.

**Features:**
- ✨ Styled with Tailwind CSS (via CDN)
- 🎯 Basic usage of components
- 📦 Examples of Props and Slots
- 🔗 Links to other demo pages

### 2. **control-structures.html** - Control Structures Demo
Demonstrates that components are correctly expanded within all Pug control structures.

**Covered Control Structures:**
- 🔁 Each loops (`each`)
- ❓ If/Else conditionals (`if`/`else`)
- 🚫 Unless conditionals (`unless`)
- 🔀 Case/When statements (`case`/`when`)
- 🔄 While loops (`while`)
- 🪆 Nested structures (combinations)

### 3. **about.html** - Slots & Props Detailed Demo
A tutorial page where you can learn advanced usage of slots and props.

**Covered Content:**
- 📦 Basic Props - How to use basic props
- 🎰 Named Slots - Multiple named slots
- 💡 Default Content - Default content
- 🔍 Conditional Slots - Conditional display of slots

## 🎨 Styling

All demo pages use the **Tailwind CSS CDN**:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

**Benefits:**
- ✅ No build required
- ✅ No additional configuration files
- ✅ Ready to use immediately
- ✅ Can be opened directly in the browser

## 📁 Directory Structure

```
examples/
├── pages/              # Pug source files
│   ├── index.pug      # Main page
│   ├── control-structures.pug  # Control structures demo
│   └── about.pug      # Slots & Props demo
├── components/         # Shared components (not used)
├── data/              # JSON data files (not used)
├── compiled/          # HTML after build (generated)
└── README.md          # This file
```

## 🔧 Customization

### Using Your Own CSS File

Instead of the Tailwind CDN, you can also use your own CSS file:

```pug
head
  link(rel="stylesheet" href="/path/to/styles.css")
```

### Adding Components

To add a new component:

1. Use the `component` keyword in a `.pug` file
2. Build with `npm run pug-tail:build`
3. Check the result in the `compiled/` directory

Example:
```pug
component Button()
  - const { label, variant = 'primary' } = $props
  button(class=`btn-${variant}`)= label

// Usage
Button(label="Click me" variant="success")
```

## 📚 Related Links

- [PugTail Documentation](https://github.com/megurock/pug-tail)
- [Pug Documentation](https://pugjs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 💡 Tips

### Live Reload

During development, it's convenient to use a file watching tool:

```bash
# Add to package.json
"scripts": {
  "watch": "nodemon --watch examples/pages --ext pug --exec npm run pug-tail:build"
}
```

### Opening Directly in the Browser

The built HTML files can be opened directly in your browser:

```bash
# macOS
open examples/compiled/index.html

# Linux
xdg-open examples/compiled/index.html

# Windows
start examples/compiled/index.html
```

### Production Build

For a production environment, it is recommended to use a built CSS file instead of the Tailwind CDN.