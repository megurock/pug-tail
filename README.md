# pug-tail

slot 構文を持つコンポーネント DSL を Pug AST 上で静的に展開するトランスパイラ

[![npm version](https://img.shields.io/npm/v/pug-tail.svg)](https://www.npmjs.com/package/pug-tail)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **複数の名前付き slot** - Vue や Svelte のような直感的なコンポーネント構文
- 📦 **props/attrs 分離** - Vue 3 風の props と attrs の明確な分離
- ⚡ **実行時コストゼロ** - ビルド時に完全展開、純粋な Pug AST を生成
- 🔧 **Pug との完全互換** - 既存の Pug 機能をそのまま使用可能
- 🚫 **ランタイム拡張なし** - Pug のランタイムを一切変更しない
- 📝 **TypeScript 製** - 型安全な実装と優れた開発体験

<img src="./images/logo.png" alt="pug-tail logo" width="200"/>

## 🤔 なぜ pug-tail？

Pug の mixin は単一の content block しか受け取れず、named block は extends 専用です。pug-tail は、この制約を AST レベルで解決し、複数の名前付き slot を持つコンポーネントシステムを実現します。

### Before（Pug mixin の制約）

```pug
mixin Card()
  .card
    .card-header
      block
    .card-body
      // 複数の block を使えない
```

### After（pug-tail）

```pug
component Card()
  .card
    .card-header
      slot(header)
        p default header
    .card-body
      slot(body)
        p default body
    .card-footer
      slot(footer)
        p default footer

// 使用例
Card()
  slot(header)
    h1 Title
  slot(body)
    p Content
  slot(footer)
    button OK
```

## 📦 Installation

```bash
npm install pug-tail
```

または

```bash
yarn add pug-tail
```

## 🚀 Quick Start

### CLI で使用

```bash
npx pug-tail src/index.pug -o dist/index.html
```

### プログラマティック API

```typescript
import { pugTail } from 'pug-tail';

const source = `
component Card()
  .card
    slot(header)
    slot(body)

Card()
  slot(header)
    h1 Hello
  slot(body)
    p World
`;

const html = pugTail.render(source);
console.log(html);
```

## 📖 Component DSL

### Component 定義

```pug
component Card()
  .card
    .card-header
      slot(header)
        p default header

    .card-body
      slot(body)
        p default body

    .card-footer
      slot(footer)
        p default footer
```

**特徴**:
- `component` は pug-tail 独自ディレクティブ
- `slot(name)` は子ノードを持つ専用タグ
- slot にはデフォルト内容を指定可能

### Component 呼び出し

```pug
Card()
  slot(header)
    h1 Title
  slot(body)
    p Content
  slot(footer)
    button OK
```

**特徴**:
- 大文字始まりの関数呼び出し風構文
- slot の順序は自由
- 指定しなかった slot はデフォルト内容を使用

### 変換結果

上記の DSL は pug-tail により以下のように展開されます：

```pug
.card
  .card-header
    h1 Title

  .card-body
    p Content

  .card-footer
    button OK
```

この純粋な Pug AST が Pug に渡され、最終的な HTML が生成されます。

### Props/Attrs 分離（Phase 3）

Vue 3 風の props と attrs の明確な分離をサポートします。

```pug
component Button()
  - const { label, type = "button", disabled = false } = props
  - const { class: className = "btn" } = attrs
  
  button(type=type disabled=disabled class=className)
    = label

// 使用例
Button(label="Submit", type="submit", class="btn-primary")
// → <button type="submit" class="btn btn-primary">Submit</button>

Button(label="Cancel")
// → <button type="button" class="btn">Cancel</button>（デフォルト値が適用）
```

**特徴**:
- JavaScript 標準の分割代入構文のみを使用
- デフォルト値のサポート（`count = 0`, `class: className = "card"`）
- リネームのサポート（`class: className`）
- 使用パターンから自動的に props/attrs を判別
- Phase 2（`attributes`）との完全な後方互換性

**動作原理**:
1. Component 内で `const { title } = props` と宣言すると、pug-tail が「このComponentはpropsから title を使う」と解析
2. 呼び出し側で `Card(title="Hello", class="my-card")` とすると、自動的に分類
   - `title` → props（使用パターンに含まれる）
   - `class` → attrs（使用パターンに含まれない）
3. Component 展開時に `const props = { title: "Hello" }` と `const attrs = { class: "my-card" }` を自動生成

**Phase 2 との互換性**:
```pug
// Phase 2 スタイル（従来通り動作）
component Card()
  - const { title, ...attrs } = attributes
  .card&attributes(attrs)
    h2= title

// Phase 3 スタイル（推奨）
component Card()
  - const { title } = props
  - const { class: className } = attrs
  .card(class=className)
    h2= title
```

## 🏗️ Architecture

pug-tail は以下の処理フローで動作します：

```
Pug Source (DSL)
    ↓
Lexer (pug-lexer)
    ↓
Parser (pug-parser)
    ↓
AST
    ↓
Component Registry ← component 定義を検出・登録
    ↓
AST Transformer   ← component 呼び出しをインライン展開
    ↓             ← slot を置換
Pure Pug AST
    ↓
Code Gen (pug-code-gen)
    ↓
HTML
```

### 主要モジュール

- **ComponentRegistry** - component 定義の管理
- **ASTTransformer** - AST 変換と slot 展開
- **SlotResolver** - slot 内容の解決
- **ErrorHandler** - エラー処理と報告

詳細は [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) を参照してください。

## 🎯 Design Principles

### 1. Pug の仕様制約を回避

Pug の mixin/block の制約を言語仕様をねじ曲げずに解決します。

### 2. ビルド時完全展開

component と slot の概念はビルド時に完全に消滅し、実行時には存在しません。

### 3. Pug をそのまま活用

Pug のランタイムを拡張せず、純粋な AST を生成することで Pug の全機能を活用できます。

## 📋 MVP Scope

### ✅ 実装済み

- component 定義と slot 定義の構文
- component 呼び出しと slot 差し込み
- 複数名前付き slot
- デフォルト slot 内容
- ネストされたコンポーネントとスロット
- 属性の受け渡しと自動フォールスルー（Phase 2）
- props/attrs の明確な分離（Phase 3）
- 使用パターンによる自動判別
- JavaScript 標準の分割代入でデフォルト値
- 基本的なエラーハンドリング
- CLI インターフェース

### ❌ 今後の対応

- scoped slot（Phase 3.5+）
- slot のネスト
- 再帰的 component 呼び出し
- source map 完全対応
- IDE プラグイン
- client-side compile

## 🔧 Development

### Setup

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# テスト
npm test

# Lint & Format
npm run check
```

### Project Structure

```
pug-tail/
├── src/           # TypeScript ソースコード
├── tests/         # テストファイル
├── examples/      # サンプルコード
└── docs/          # ドキュメント
```

## 📄 License

MIT License - see the [LICENSE](./LICENSE) file for details

## 🙏 Acknowledgments

- [Pug](https://pugjs.org/) - The amazing template engine
- Inspired by Vue.js component systems

---

**Status**: ✅ Phase 3 完了 - Props/Attrs 分離実装完了（168/168 テストパス）

**Next**: Scoped slot の検討（Phase 3.5）
