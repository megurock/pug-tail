# PugTail Examples

This directory contains demo pages where you can experience the features of PugTail.

## 🚀 Build and Run

```bash
# From the project root
npm run build

# Check the generated HTML
open ../demo/index.html
```

## 📄 Demo Pages

### 1. **index.html** - Main Demo Page
A landing page that introduces the overview and main features of PugTail.

**Features:**
- ✨ Styled with Tailwind CSS (via CDN)
- 🎯 Basic usage of components
- 📦 Examples of Props and Slots
- 🔗 Links to other demo pages

### 2. **about.html** - Slots & Props Detailed Demo
A tutorial page where you can learn advanced usage of slots and props.

**Covered Content:**
- 📦 Basic Props - How to use basic props
- 🎰 Named Slots - Multiple named slots
- 💡 Default Content - Default content
- 🔍 Conditional Slots - Conditional display of slots
- 
### 3. **cli-guide.html** - CLI Usage Guide
A practical guide on how to use the PugTail CLI. It explains how to pass data to pages and build them.

**Features:**
- 📦 Passing data from JSON files (`--data`, `--data-files`)
- 📄 Building specific pages
- ⚙️ Using a configuration file (`pugtail.config.js`)

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
.
├── demo/               # HTML after build (generated)
│   ├── index.html
│   ├── about.html
│   └── cli-guide.html
└── examples/
    ├── pages/              # Pug source files for each page
    │   ├── index.pug
    │   ├── about.pug
    │   └── cli-guide.pug
    ├── components/         # Shared components used across pages
    ├── data/               # JSON data for pages
    │   ├── global.json     # Global data available to all pages
    │   ├── index.json      # Data for index.pug
    │   ├── about.json      # Data for about.pug
    │   └── cli-guide.json  # Data for cli-guide.pug
    └── pugtail.config.js   # PugTail configuration file
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
2. Build with `npm run build`
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
  "watch": "nodemon --watch examples/pages --ext pug --exec npm run build"
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