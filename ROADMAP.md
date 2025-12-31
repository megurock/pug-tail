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

**Phase 2 (v2.0.0) 完了** ✅

Phase 2 では attributes サポートを完全実装しました：
- Component への attributes 渡し（型保持）
- 単一ルート要素への自動属性フォールスルー
- 複数ルート要素の検出と Warning
- class 属性の自動マージ
- pug.merge 関数の実装

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

## Phase 3: props 定義の導入（予定）

### 目標

`@props` 構文の導入と、props/attrs の自動判定を実装します。

### 実装する機能

#### 1. @props 構文

```pug
component Card()
  @props {
    title: { type: String, default: "Hello" },
    count: { type: Number, default: 0 }
  }
  
  .card
    h2= title
    p Count: #{count}
```

**ルール:**
- `@props` に定義されたキー → props
- それ以外 → attrs
- default / required / type チェックをサポート

---

#### 2. props / attrs の自動判定

**実装方法:**

Babel を使って Code ノードを解析:

```typescript
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

function detectAttributesUsage(codeVal: string): {
  usedProps: string[]
  hasRestSpread: boolean
  restSpreadName?: string
} {
  const ast = parse(codeVal, {
    sourceType: 'module',
    plugins: ['jsx']
  })
  
  const usedProps: string[] = []
  let hasRestSpread = false
  let restSpreadName: string | undefined
  
  traverse.default(ast, {
    VariableDeclarator(path) {
      // 分割代入から変数を抽出
      if (path.node.id.type === 'ObjectPattern') {
        path.node.id.properties.forEach(prop => {
          if (prop.type === 'ObjectProperty') {
            usedProps.push(prop.key.name)
          } else if (prop.type === 'RestElement') {
            hasRestSpread = true
            restSpreadName = prop.argument.name
          }
        })
      }
    },
    
    MemberExpression(path) {
      // attributes.title のような参照を検出
      if (path.node.object.name === 'attributes') {
        usedProps.push(path.node.property.name)
      }
    }
  })
  
  return { usedProps, hasRestSpread, restSpreadName }
}
```

**判定ロジック:**
```typescript
// Component 内のすべての Code ノードを解析
const allUsedProps = new Set<string>()

for (const node of componentBody.nodes) {
  if (node.type === 'Code') {
    const { usedProps } = detectAttributesUsage(node.val)
    usedProps.forEach(prop => allUsedProps.add(prop))
  }
}

// 呼び出し側の attributes と比較
const props = {}
const attrs = {}

for (const [key, value] of Object.entries(callAttrs)) {
  if (allUsedProps.has(key)) {
    props[key] = value  // props
  } else {
    attrs[key] = value  // attrs
  }
}
```

---

#### 3. Scoped slot 対応

slot に名前付き props を渡せるようにします。

```pug
component List()
  each item in attributes.items
    slot(item, index=item.id)
      li= item.name
```

**slot props は component → slot への出力**であり、component 呼び出しの引数とは無関係です。

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

**合計: 6-8日**

- Babel の統合（2日）
- @props 構文の実装（2日）
- props/attrs 自動判定（2日）
- Scoped slot（2-3日）
- ドキュメント・テスト（1日）

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
- 明示的な `@props` 定義を推奨

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
  @props { title, count }
  
  .card
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

### v3.0.0 (Phase 3) - 予定

- @props 構文
- props/attrs 自動判定（Babel 統合）
- Scoped slot
- 推定工数: 6-8日

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
