# pug-tail ロードマップ

このドキュメントは、pug-tail の今後の開発計画と設計方針をまとめたロードマップです。
本ロードマップでは **「attributes を props として再解釈する」** という設計思想を中核に据えています。

---

## 設計思想（重要）

### pug-tail の component とは

pug-tail の component は **Pug の mixin ではなく、Vue 風の UI コンポーネント**です。

- 見た目の構文は Pug に寄せる
- 意味論・設計原則は Vue コンポーネントに寄せる

### attributes = props（再解釈）

component 呼び出し時に渡される値は **すべて attributes として受け取る**。

```pug
Card(title="Hello", count=5, class="my-card")
```

内部的には次のように扱われます：

- `attributes` は **component の入力としての raw data**
- component が消費したもの → **props**
- 消費されなかったもの → **attrs（フォールスルー属性）**

これは Vue における `props` と `$attrs` の関係と同等です。

---

## 現在のステータス

**Phase 2.5 完了** ✅

Phase 2 では attributes サポートを完全実装しました：
- Component への attributes 渡し（型保持）
- 単一ルート要素への自動属性フォールスルー
- 複数ルート要素の検出と Warning
- class 属性の自動マージ
- pug.merge 関数の実装

Phase 2.5 では明示的な属性制御を実装しました：
- 明示的な&attributes制御の検出
- 制御構文（if/else, each, case/when）内でのslot展開

---

## Phase 2: 属性サポート（✅ 完了）

### 実装内容

Phase 2 では Component への attributes 渡しと、基本的な属性フォールスルーを完全実装しました。

### 実装した機能

#### 1. Component への attributes 渡し ✅

**実装方法:**
```typescript
// Component 呼び出し時の attrs を抽出
const callAttrs = extractAttributes(callNode)

// Component 内部で attributes オブジェクトとして利用可能にする
const attributesCode: Code = {
  type: 'Code',
  val: `var attributes = {${attrs.map(a => `${a.name}: ${a.val}`).join(', ')}}`,
  buffer: false,
  mustEscape: false,
  isInline: false,
  line: 0
}

// Component body の先頭に挿入
componentBody.nodes.unshift(attributesCode)
```

**重要:** `var` を使用することで、ネストされた Component で Pug の `with` 文とのスコープ問題を回避します。

**使用例:**
```pug
component Card()
  h2= attributes.title
  p Count: #{attributes.count}

Card(title="Hello", count=5)
```

---

#### 2. 属性フォールスルー（自動） ✅

**実装方法:**
```typescript
// ルート要素を検出
const rootElement = findRootElement(componentBody)

// 既に &attributes がなければ追加
if (!hasAttributeBlocks(rootElement)) {
  rootElement.attributeBlocks.push({
    type: 'AttributeBlock',
    val: 'attributes'
  })
}
```

**重要な発見:**
- `&attributes` は Mixin 専用ではなく、通常のタグでも使える Pug の標準機能
- class や id のマージは Pug ランタイムが自動的に行う
- pug-tail は AST に `attributeBlocks` を追加するだけでよい

**使用例:**
```pug
component Card()
  .card
    h2= attributes.title

Card(title="Hello", class="my-card")
// → <div class="card my-card"><h2>Hello</h2></div>
```

---

#### 3. 属性フォールスルー（明示的） ✅

Component 作成者が `&attributes(attrs)` を明示的に記述できます。

**推奨パターン（props / attrs 分離）:**
```pug
component Card()
  - const { title, count, ...attrs } = attributes
  
  .card&attributes(attrs)
    h2= title
    p Count: #{count}
```

pug-tail は Code ノードをそのまま保持し、Pug が処理します。

---

#### 4. 複数ルート要素の検出と Warning ✅

```typescript
const rootElements = findRootElements(componentBody)

if (rootElements.length > 1) {
  console.warn(
    `Component "${componentName}" has multiple root elements. ` +
    `Attributes fallthrough is disabled. Use &attributes explicitly.`
  )
}
```

---

### 実装しない機能（Phase 3 へ延期）

#### ❌ props / attrs の自動判定

**理由:**
- Code ノード（`- const x = ...`）は文字列として格納されている
- `attributes.title` という参照を静的に検出するには JavaScript パーサーが必要
- Phase 3 で Babel を導入して対応

**Phase 2 での対応:**
明示的な分離パターンを推奨
```pug
component Card()
  - const { title, count, ...attrs } = attributes
  .card&attributes(attrs)
```

---

#### ❌ Scoped slot

**理由:**
- 仕様の詳細化が必要
- Phase 3 で対応

---

### 技術的な発見

#### 1. &attributes は Mixin 専用ではない

検証により、`&attributes` は通常のタグでも使える Pug の標準機能であることが判明しました。

```pug
- var myAttrs = { id: 'card-1', class: 'my-card' }
.card&attributes(myAttrs)
  p This is a card
```

生成される HTML:
```html
<div class="card my-card" id="card-1">
  <p>This is a card</p>
</div>
```

**重要:** class が自動的にマージされます！

---

#### 2. Pug は Code ノードを解析していない

pug-code-gen のソースコードを調査した結果:

```javascript
visitCode: function(code) {
  if (code.buffer) {
    // 出力する場合の処理
  } else {
    this.buf.push(code.val);  // ← そのまま出力！
  }
}
```

**発見:**
- Pug は `code.val` をそのまま JavaScript コードとして出力
- 内容は解析されず、実行時に JavaScript エンジンが処理
- props/attrs の自動判定には JavaScript パーサー（Babel）が必要

---

#### 3. 制御構文は Code ノードではない

Pug AST では、制御構文は専用のノードタイプとして表現されます:

- `each` → `Each` ノード
- `if/else` → `Conditional` ノード
- `case/when` → `Case/When` ノード

**重要:** Component 内部で Pug の全ての制御構文が使えます！

```pug
component DataTable()
  - const columns = attributes.columns || []
  - const rows = attributes.rows || []
  
  table
    thead
      tr
        each col in columns
          th= col.label
    tbody
      each row in rows
        tr
          each col in columns
            td= row[col.key]
```

---

#### 4. constantinople は定数判定のみ

Pug が内部で使用している `constantinople` パッケージを調査した結果:

**用途:** 定数判定・定数評価（最適化）
**制約:** 変数抽出機能はない

```javascript
constantinople('"Hello"')  // true → "Hello"
constantinople('5')         // true → 5
constantinople('attributes.title')  // false
```

**結論:**
- Phase 2-3 では使用しない
- Phase 4+（最適化フェーズ）で検討可能

---

#### 5. pug.merge 関数の実装 ✅

`&attributes` で使用される `pug.merge` 関数を実装しました。

**実装方法:**
```typescript
merge: (...args: unknown[]) => {
  // 最初の引数が配列の場合、それを展開
  const sources: Record<string, unknown>[] = args.length === 1 && Array.isArray(args[0])
    ? args[0]
    : (args as Record<string, unknown>[])
  
  const base: Record<string, unknown> = {}
  
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    
    for (const [key, val] of Object.entries(source as Record<string, unknown>)) {
      if (key === 'class') {
        // class 属性は自動マージ
        base.class = mergeClasses(base.class, val)
      } else {
        base[key] = val
      }
    }
  }
  return base
}
```

**特徴:**
- 配列形式と可変長引数の両方に対応
- class 属性の自動マージをサポート
- `transform.ts` と `htmlGeneration.test.ts` の両方に実装

---

### 実際の工数

**合計: 4日間**

- Step 1: attributes 渡しの実装（完了）
  - `extractAttributes()` の実装
  - Component body への Code ノード挿入
  - テスト作成

- Step 2: 属性フォールスルーの実装（完了）
  - `findRootElements()` の実装
  - `&attributes` の自動挿入
  - 複数ルート要素の検出と Warning
  - pug.merge 関数の実装
  - テスト作成

- Step 3: 既存機能との統合（完了）
  - `astTransformer.ts` の修正
  - エラーハンドリングの追加
  - 統合テスト

- Step 4: ドキュメント更新（未完了）
  - README.md の更新
  - 使用例の追加

---

### テスト結果

**✅ 140件すべてパス**

- Unit tests: ✅ すべてパス
- Integration tests: ✅ すべてパス
- E2E tests: ✅ すべてパス
- Fixtures tests: ✅ すべてパス

**追加したテストフィクスチャ:**
- `tests/fixtures/attributes/basic.*` - 基本的な attributes 渡し
- `tests/fixtures/attributes/fallthrough.*` - 属性フォールスルー
- `tests/fixtures/attributes/type-preservation.*` - 型保持
- `tests/fixtures/edge-cases/multiple-roots.*` - 複数ルート要素

---

## Phase 3: props/attrs 識別子の導入（予定）

### 目標

`props` と `attrs` 識別子を導入し、プロパティと属性を明確に分離します。
シンプルで直感的な API を提供し、JavaScript 標準の機能のみを活用します。

### 設計原則

1. **シンプル**: 新しい構文を導入しない（JavaScript 標準のみ）
2. **明確**: props と attrs の区別を明示的にする
3. **ゼロランタイム**: ビルド時に完全展開
4. **実用的**: 実際の問題を解決する

---

### 実装する機能

#### 1. props/attrs 識別子

**基本的な使い方:**
```pug
component Card()
  - const { title, count } = props
  - const { class: className = "card" } = attrs
  
  .card(class=className)
    h2= title
    p Count: #{count}

Card(title="Hello", count=5, class="my-card")
```

**内部処理:**
```typescript
// Step 1: Component定義を事前解析
const usage = detectAttributeUsage(componentBody)
// → { fromProps: ['title', 'count'], fromAttrs: ['class'] }

// Step 2: 呼び出し側の属性を分類
const props = { title: "Hello", count: 5 }
const attrs = { class: "my-card" }

// Step 3: JavaScriptコードを生成（Phase 2と同じ方法）
var props = { "title": "Hello", "count": 5 }
var attrs = { "class": "my-card" }

// ユーザーのコード（そのまま）
const { title, count } = props
const { class: className = "card" } = attrs
```

**特徴:**
- ✅ props と attrs が明確に分離される
- ✅ デフォルト値は JavaScript 標準の分割代入構文で設定
- ✅ リネームも JavaScript 標準構文で可能
- ✅ Vue 3 の概念と一致（学習コスト低）

---

#### 2. デフォルト値のサポート

**JavaScript 標準の分割代入構文を使用:**
```pug
component Button()
  - const { label, type = "button", disabled = false } = props
  - const { class: className = "btn" } = attrs
  
  button(type=type disabled=disabled class=className)
    = label

// ケース1: すべて指定
Button(label="Submit", type="submit", disabled=true, class="btn-primary")
// → type="submit", disabled=true, class="btn-primary"

// ケース2: 一部だけ指定
Button(label="Cancel")
// → type="button" (デフォルト), disabled=false (デフォルト), class="btn" (デフォルト)

// ケース3: classだけカスタマイズ
Button(label="Save", class="btn-success")
// → type="button" (デフォルト), disabled=false (デフォルト), class="btn-success"
```

**重要:** デフォルト値は JavaScript エンジンが処理するため、特別な実装は不要です。

---

#### 3. props/attrs の自動判別

**判別ロジック:**
```typescript
function detectAttributeUsage(componentBody: Block): {
  fromProps: string[]
  fromAttrs: string[]
} {
  const fromProps: string[] = []
  const fromAttrs: string[] = []
  
  walk(componentBody, (node) => {
    if (node.type === 'Code') {
      const code = node.val
      
      // "const { title, count } = props" を検出
      if (code.includes('= props')) {
        const vars = extractDestructuredVars(code)
        fromProps.push(...vars)  // ['title', 'count']
      }
      
      // "const { class: className } = attrs" を検出
      if (code.includes('= attrs')) {
        const vars = extractDestructuredVars(code)
        fromAttrs.push(...vars)  // ['class']
      }
    }
  })
  
  return { fromProps, fromAttrs }
}
```

**分類ルール:**
- `props` から取得されたプロパティ → **props**
- `attrs` から取得されたプロパティ → **attrs**
- どちらも指定されていない → **attrs**（デフォルト、自動フォールスルー）

---

#### 4. Babel 統合による変数抽出

**実装方法:**
```typescript
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

function extractDestructuredVars(code: string): string[] {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript']
  })
  
  const vars: string[] = []
  
  traverse.default(ast, {
    VariableDeclarator(path) {
      if (path.node.id.type === 'ObjectPattern') {
        path.node.id.properties.forEach(prop => {
          if (prop.type === 'ObjectProperty') {
            // 元のキー名を記録（リネーム対応）
            // const { class: className } → 'class' を記録
            const keyName = prop.key.type === 'Identifier' 
              ? prop.key.name 
              : prop.key.value
            vars.push(keyName)
          }
        })
      }
    }
  })
  
  return vars
}
```

**対応する構文:**
- ✅ 基本的な分割代入: `const { title } = props`
- ✅ デフォルト値: `const { title = "Default" } = props`
- ✅ リネーム: `const { class: className } = attrs`
- ✅ 複合: `const { title = "Default", class: className = "card" } = props`

---

#### 5. Phase 2.5 との統合

**Phase 2.5 の手動制御を尊重:**
```pug
component Input()
  - const { label, placeholder } = props
  .wrapper
    label= label
    input.field&attributes(attrs)  // ← 明示的に制御（Phase 2.5）

Input(label="Name", placeholder="Enter name", type="text", class="input")
```

**動作:**
- `&attributes(attrs)` が明示的に書かれている → 手動制御（Phase 2.5）
- 自動フォールスルーはスキップ
- `input.field` に `type`, `class` だけが適用される

**Phase 3 の改善点:**
- `label`, `placeholder` は props として扱われる
- `attrs` には `type`, `class` のみが含まれる
- `&attributes(attrs)` に正しい値が渡される

---

#### 6. attributes との互換性

**Phase 2 互換性を維持:**
```pug
component Card()
  // Phase 2 スタイル（従来通り動作）
  - const { title, count } = attributes
  .card
    h2= title
    p Count: #{count}

  // または Phase 3 スタイル（推奨）
  - const { title, count } = props
  - const { class } = attrs
```

**動作:**
- `attributes` を使用した場合は Phase 2 と同じ動作
- `props`/`attrs` を使用した場合は Phase 3 の動作
- 両方とも正常に動作する

---

### 実装しない機能

#### ❌ @props 構文

**理由:**
- 新しい構文を覚える必要がある
- JavaScript 標準の分割代入で十分
- 実装が複雑になる

```pug
// これは実装しない
@props {
  title: { type: String, default: "Hello" }
}
```

**代わりに:**
```pug
// JavaScript 標準構文を使用
- const { title = "Hello" } = props
```

---

#### ❌ 型検証（type）

**理由:**
- pug-tail はビルド時に完全展開される（ゼロランタイム）
- ランタイムで型チェックする必要がない
- TypeScript を使えば型安全性は確保できる

```pug
// これは実装しない
@props {
  title: { type: String }  // ← ランタイム型チェック不要
}
```

---

#### ❌ 必須チェック（required）

**理由:**
- ビルド時変換では必須チェックは意味がない
- 呼び出し側で渡されていなければ `undefined` になるだけ
- TypeScript の型システムで対応可能

```pug
// これは実装しない
@props {
  title: { required: true }  // ← ビルド時変換には不要
}
```

---

#### ❌ カスタムバリデーション

**理由:**
- ビルド時変換では実行できない
- ゼロランタイムの原則に反する

---

#### ⏸️ Scoped slot（Phase 3.5 以降に延期）

**理由:**
- 仕様の詳細化が必要
- Phase 3 の実装を完了させてから検討

---

### 必要な依存関係

```json
{
  "dependencies": {
    "@babel/parser": "^7.23.0",
    "@babel/traverse": "^7.23.0"
  }
}
```

---

### 推定工数

**合計: 3-4日**

- Babel の統合（1日）
  - `@babel/parser` と `@babel/traverse` のセットアップ
  - `extractDestructuredVars()` の実装
  - リネーム対応（`class: className`）

- props/attrs 識別子の実装（1日）
  - `detectAttributeUsage()` の実装
  - `createPropsCode()` と `createAttrsCode()` の実装
  - Component本体への挿入ロジック

- 自動判別とフォールスルー（1日）
  - 分類ロジックの実装
  - Phase 2.5との統合（手動制御の検出）
  - attrs の自動フォールスルー

- テストとドキュメント（1日）
  - テストフィクスチャの作成
  - 統合テスト
  - README.md の更新

**Phase 3はシンプル版のため、当初予定の6-8日から3-4日に短縮**

---

## Phase 4+: 最適化・開発体験向上（将来）

### 最適化

- constantinople を使った定数畳み込み
- ビルド時の属性評価
- 生成コードの最適化

### 開発体験

- Watch mode
- Incremental build
- IDE 拡張（VSCode）
- AST 可視化・デバッグツール

---

## 技術的な制約と解決策

### 制約 1: Code ノードは文字列として格納される

**影響:**
- props/attrs の自動判定が困難
- JavaScript パーサーが必要

**解決策:**
- Phase 2: 明示的な分離パターンを推奨
- Phase 3: Babel を導入して解析

---

### 制約 2: Pug は Code ノードを解析していない

**影響:**
- Pug レベルでは Code ノードの内容を理解できない
- 独自の解析が必要

**解決策:**
- Phase 3 で Babel を使って JavaScript コードを解析

---

### 制約 3: 動的な参照は検出不可能

**例:**
```pug
component Card()
  - const key = 'title'
  - const value = attributes[key]  // ← 静的解析では検出不可
```

**解決策:**
- ベストエフォート（検出可能なものだけ）
- 明示的な `props`/`attrs` からの分割代入を推奨

---

## 注意事項

### 明示的にサポートしないこと

- component 位置引数（JS 関数的な引数）
- mixin の二段呼び構文
- 推測による props / attrs 判定（名前ベース）

### 推奨パターン

**Phase 2:**
```pug
component Card()
  - const { title, count, ...attrs } = attributes
  .card&attributes(attrs)
    h2= title
```

**Phase 3:**
```pug
component Card()
  - const { title, count } = props
  - const { class: className } = attrs
  
  .card(class=className)
    h2= title
```

---

## バージョン履歴

### v1.0.0 (MVP) - 2024/12

- component / slot 構文
- 複数名前付き slot
- デフォルト slot 内容
- 基本的なエラーハンドリング
- CLI インターフェース

### v2.0.0 (Phase 2) - 2024/12 ✅ 完了

- Component への attributes 渡し（型保持）
- 単一ルート要素への自動属性フォールスルー
- 複数ルート要素の検出と Warning
- class 属性の自動マージ
- pug.merge 関数の実装
- var によるスコープ問題の回避
- 140件のテストすべてパス

### v2.5.0 (Phase 2.5) - 2025/01 ✅ 完了

- 明示的な&attributes制御のサポート
- hasAnyAttributeBlocks()関数の追加
- 制御構文（Conditional, Each, Case）内でのslot展開
- 型安全性の向上（any型の排除）
- 152件のテストすべてパス

### v3.0.0 (Phase 3) - 予定

- props/attrs 識別子の導入
- props/attrs 自動判別（Babel 統合）
- JavaScript 標準の分割代入でデフォルト値サポート
- Phase 2.5との統合（手動制御の尊重）
- 推定工数: 3-4日

---

## 参考リンク

### 内部調査レポート

以下の調査により、技術的な制約と解決策が明確になりました:

- **Pug AST 構造の検証**: Code ノードと制御構文の違い
- **pug-code-gen の解析**: Pug が Code ノードをどう処理しているか
- **constantinople の評価**: 定数判定の仕組みと制約
- **Babel による変数抽出**: Phase 3 での実装方針
- **&attributes の検証**: Mixin 専用ではなく標準機能であることを確認

これらの調査結果は `/playground` ディレクトリと `/mnt/user-data/outputs` に保存されています。

---

**このロードマップは設計の進化に応じて随時更新されます。**
