# pug-tail

Vue/Svelte のようなコンポーネント記法を Pug にもたらすビルドツール

<img src="./images/pug-tail-logo.png" alt="pug-tail logo"/>

[![npm version](https://img.shields.io/npm/v/pug-tail.svg)](https://www.npmjs.com/package/pug-tail)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[English](README.md)

### 🤖 AI支援による開発に関する注記

> [!NOTE]
> このプロジェクトは、大規模言語モデル（LLM）の支援を大きく受けて開発された、**実験的なプロジェクト**です。
>
> 機能はしますが、コードベースには一般的ではない解決策が含まれていたり、さらなる改良が必要な場合があります。フィードバックやコントリビュートを心よりお待ちしております。

## ✨ 機能

- 🎯 **複数の名前付きスロット** - Vue や Svelte のような直感的なコンポーネント構文
- 📦 **Props/Attrsの分離** - Vue 3 スタイルの明確なpropsとattrsの分離
- ⚡ **ゼロランタイムコスト** - ビルド時に完全に展開され、純粋な Pug の AST を生成
- 🔄 **制御フローのサポート** - コンポーネント内で if/unless/each/while/case を使用可能
- 🔧 **Pug との統合** - include, extends, mixinなど他の Pug の機能と連携
- 🚫 **ランタイム拡張なし** - Pug のランタイムへの変更は一切なし
- ⚙️ **強力な CLI** - ウォッチモード、設定ファイル、データファイルの読み込みをサポート
- 📝 **TypeScript 製** - 型安全な実装と優れた開発者体験

## 🌐 ライブデモ

pug-tail の機能を実際に体験できます：

- **[メインデモ](https://megurock.github.io/pug-tail/)** - インタラクティブな例と機能紹介
- **[CLI ガイド](https://megurock.github.io/pug-tail/cli-guide.html)** - 完全な CLI ドキュメント
- **[スロット & Props](https://megurock.github.io/pug-tail/about.html)** - 高度な使用例

## 🤔 なぜ pug-tail か？

Pug の mixin は単一のコンテンツブロックしか受け取れず、名前付きブロックは `extends` に限定されています。pug-tail は AST レベルでこの制約を解決し、複数の名前付きスロットを持つコンポーネントシステムを可能にします。

### Before (Pug の mixin の制約)

```pug
mixin Card()
  .card
    .card-header
      block
    .card-body
      // 複数のブロックは使えない
```

### After (pug-tail)

```pug
component Card()
  .card
    .card-header
      slot(header)
        p デフォルトのヘッダー
    .card-body
      slot(body)
        p デフォルトのボディ
    .card-footer
      slot(footer)
        p デフォルトのフッター

// 使用法
Card()
  slot(header)
    h1 タイトル
  slot(body)
    p コンテンツ
  slot(footer)
    button OK
```

## 📦 インストール

**Alpha Release** - 現在アルファテスト中：

```bash
npm install pug-tail@alpha
```

または

```bash
yarn add pug-tail@alpha
```

> **注意**: これはアルファ版です。最新のアルファ版をインストールするには `@alpha` タグを使用してください。

## 🚀 クイックスタート

### CLI での使用

```bash
# 基本的な使い方
npx pug-tail src/index.pug -o dist/index.html

# ディレクトリをまとめて変換
npx pug-tail src -o dist

# ウォッチモードでの開発
npx pug-tail src -o dist -w

# データファイルと共に使用
npx pug-tail src/index.pug -o dist/index.html --obj data.json

# 設定ファイルを使用
npx pug-tail -c pugtail.config.js

# エントリーパターンを指定（どのファイルをコンパイルするか）
# カンマ区切り
npx pug-tail src -o dist -e "**/*.pug,!**/components/**"

# またはスペース区切り
npx pug-tail src -o dist -e "**/*.pug" "!**/components/**"
```

**主なCLIオプション**:
- `-o, --out <dir>` - 出力ディレクトリまたはファイル
- `-e, --entry-files <patterns>` - エントリーファイルパターン（カンマまたはスペース区切り）
  - どの .pug ファイルを HTML にコンパイルするかを決定
  - `!` を使った除外パターンをサポート
  - 例: `-e "**/*.pug" "!**/components/**"`
  - デフォルト（未指定の場合）: `['**/*.pug', '!**/_*.pug', '!**/*.component.pug', '!**/components/**/*.pug']`
  - **注意**: デフォルトでは `_` で始まるファイル、`*.component.pug`、`components/` ディレクトリ内のファイルはコンパイル対象から除外されます
- `-w, --watch` - ウォッチモード（ファイルの変更を監視）
- `-c, --config <path>` - 設定ファイルのパス
- `--obj <path>` - データファイル（JSON）のパス
- `--pretty` - HTML 出力を整形する
- `--basedir <path>` - 絶対パスでの include の基準ディレクトリ
- `-d, --debug` - デバッグ出力を有効化（コンポーネント登録、スロット検出などの詳細を表示）

#### ページごとのデータファイル

エントリーとなる Pug ファイル内で `$dataFiles` ディレクティブを使用することで、ページ固有の外部データファイルを読み込めます。

```pug
// pages/index.pug
- const $dataFiles = ['/data/navigation.json', '/data/footer.json']

// これらのファイルのデータが利用可能になる
header
  each item in navigation
    a(href=item.url)= item.label
```

**重要な制約**:
- エントリーファイル（コンパイル対象のトップレベルファイル）でのみ利用可能
- インクルードされるコンポーネントファイル内では使用不可
- 絶対パス（`/` で始まる）は `basedir` からの相対パスとして解決
- 相対パスはエントリーファイルからの相対パスとして解決

詳細は[設定ガイド](./docs/CONFIGURATION.md)（英語）を参照してください。

### 設定ファイル

複雑なプロジェクトでは、設定ファイル（`pugtail.config.js`）を使用します：

```javascript
export default {
  files: {
    input: 'src/pages/**/*.pug',
    output: 'dist',
    root: 'src/pages',
    entry: [
      '**/*.pug',                    // 全ての .pug ファイル
      '!**/_*.pug',                  // _ で始まるファイルを除外
      '!**/*.component.pug',         // コンポーネントファイルを除外
      '!**/components/**/*.pug',     // components ディレクトリを除外
    ],
  },
  basedir: 'src',
  pretty: true,
  data: './data/global.json',
  dataKey: 'global',
}
```

`entry` パターンは、どのファイルを HTML にコンパイルするかを決定します。これらのパターンにマッチしないファイル（コンポーネントなど）は、include 時に処理されますが、出力ファイルは生成されません。

### プログラマティックAPI

```typescript
import { transform } from 'pug-tail'

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
`

const result = transform(source, { output: 'html' })
console.log(result.html)
```

## 📖 コンポーネント DSL

### 基本的な使い方

```pug
// コンポーネント定義
component Card()
  .card
    .card-header
      slot(header)
        p デフォルトのヘッダー
    .card-body
      slot(body)
        p デフォルトのボディ

// コンポーネント呼び出し
Card()
  slot(header)
    h1 タイトル
  slot(body)
    p コンテンツ
```

この DSL はビルド時に純粋な Pug に展開され、最終的な HTML を生成します。

### 主な機能

#### 複数の名前付きスロット

Vue や Svelte のように、複数の名前付きスロットを定義できます。

```pug
component Layout()
  header
    slot(header)
  main
    slot(main)
  footer
    slot(footer)

Layout()
  slot(header)
    h1 マイサイト
  slot(main)
    p コンテンツ
  slot(footer)
    p © 2026
```

#### Props/Attrs の分離

Vue 3 スタイルの `$props` と `$attrs` による明確な分離が可能です。

```pug
component Button()
  - const { label, type = "button" } = $props
  - const { class: className = "btn" } = $attrs
  button(type=type class=className)= label

Button(label="送信", type="submit", class="btn-primary")
```

- `$props` で宣言されていないプロパティは、自動的に`$attrs` に分類されます
- デフォルト値やリネームもサポートしています

#### 属性の自動フォールスルー

コンポーネントに渡された属性は、自動的にルート要素に適用されます。

```pug
component Card()
  .card
    h2 タイトル

Card(class="my-card", id="card-1")
// → <div class="card my-card" id="card-1">...</div>
```

手動での制御も可能です。

```pug
component Input()
  .wrapper
    input&attributes(attributes)

Input(type="text", class="primary")
// 属性がinputに適用される
```

#### スコープ分離

コンポーネントは独立したスコープを持ち、外部の変数への直接アクセスを防ぎます。

```pug
// ❌ エラー
- const message = 'Hello'
component Card()
  p= message

// ✅ 正しい方法: props で渡す
- const message = 'Hello'
component Card()
  - const { text } = $props
  p= text
Card(text=message)
```

### 詳細なドキュメント

完全なコンポーネント DSL のドキュメントはこちらです（英語）:

- [Component DSL Reference](./docs/COMPONENTS.md) - 完全なリファレンスガイド
- [Configuration Guide](./docs/CONFIGURATION.md) - 設定オプション

## 📚 ドキュメンテーション (英語)

- [Configuration Guide](./docs/CONFIGURATION.md) - CLI オプション、設定ファイル、データ読み込み
- [Component DSL Reference](./docs/COMPONENTS.md) - 完全なコンポーネント構文リファレンス
- [Architecture](./docs/ARCHITECTURE.md) - 内部設計と処理フロー
- [Contributing](./docs/CONTRIBUTING.md) - 開発セットアップとガイドライン

## 🔧 開発

### セットアップ

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# テスト
npm test

# Lint & フォーマット
npm run check
```

### コントリビュート

コントリビュートに興味がありますか？ [コントリビューションガイド](./docs/CONTRIBUTING.md)（英語）をご覧ください。

## 📄 ライセンス

MIT ライセンス - 詳細は[LICENSE](./LICENSE)ファイルをご覧ください。

## 🙏 謝辞

- [Pug](https://pugjs.org/) - 素晴らしいテンプレートエンジン
- [Vue.js](https://vuejs.org/)のコンポーネントシステムにインスパイアされました

---

**ステータス**: Alpha Release (v0.1.0-alpha.0) - 286 件のテストが成功 ✅