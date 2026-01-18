# PugTail Examples

This directory contains demo pages where you can experience the features of PugTail.

## 🚀 Build and Run

```bash
# From the examples directory
$ pwd
/path/to/pug-tail/examples

$ npm run build

# Check the generated HTML
$ open ../demo/index.html
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

All demo pages use **Tailwind CSS via CDN** for quick setup and easy viewing:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

No build step or configuration required—just open the HTML files directly in your browser.

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

## 🔧 Adding Your Own Components

To add a new component:

1. Create a `.pug` file with the `component` keyword
2. Build with `npm run build`
3. Check the result in `../demo/`

Example:
```pug
component Button()
  - const { label, variant = 'primary' } = $props
  button(class=`btn-${variant}`)= label

// Usage with shorthand syntax
- const label = "Click me"
Button(label, variant="success")
```

## 📚 Learn More

- [PugTail Documentation](https://github.com/megurock/pug-tail)
- [Pug Documentation](https://pugjs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)