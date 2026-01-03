# pug-tail 機能改善計画

**作成日:** 2025-01-03  
**最終更新:** 2026-01-03

---

## ✅ Phase 4 実装完了（2026-01-03）

### TDZ問題の根本解決

**Phase 4: TDZ問題の根本解決** が実装完了しました。

- ✅ 実装完了日: 2026-01-03
- ✅ テスト結果: **231/231 テスト合格**
- ✅ Phase 2/3/3.5 互換性: 完全維持
- ✅ **同名変数の受け渡しが可能に！**

### 解決された問題

Phase 3.5で制約事項だった「同名変数の受け渡し」が完全に動作するようになりました：

```pug
---
"@dataFiles":
  - navigation.json
---

component Header()
  - const { navigation } = $props
  nav
    each item in navigation
      a(href=item.url)= item.label

component Layout()
  - const { navigation } = $props
  html
    body
      Header(navigation=navigation)  # ✅ 動作する！

Layout(navigation=navigation)  # ✅ 動作する！（以前は制限あり）
```

### 技術的な解決策

**問題の本質:**
- JavaScriptのTDZ（Temporal Dead Zone）により、ブロックスコープ内で同名変数を参照できない
- Phase 3のブロックスコープ `{ const $props = {...}; const { navigation } = $props }` で発生

**解決策: IIFEラッパー**

ブロック全体をIIFE（即時実行関数式）で囲み、変数を関数パラメータとして受け取ることでTDZを回避：

```javascript
// Before (Phase 3.5 - TDZエラー)
{
  const $props = {"navigation": navigation};  // ← TDZ!
  const { navigation } = $props;
}

// After (Phase 4 - TDZ回避)
((__pug_arg_navigation) => {
  const $props = {"navigation": __pug_arg_navigation};  // ← OK!
  const { navigation } = $props;
})(navigation);  // ← 引数はIIFE外のスコープで評価
```

**ポイント:**
- IIFE引数は呼び出し時（ブロック外）で評価される
- パラメータ名をリネーム（`__pug_arg_`プレフィックス）することで内部のconst宣言と衝突しない
- 変数参照がない場合は従来のシンプルなブロックスコープを使用（パフォーマンス最適化）

### 変更ファイル

1. **src/utils/usageDetector.ts**
   - 未使用関数 `createTempVarsCode()` と `createPropsCodeWithTempVars()` を削除
   - `isVariableReference()` をexport
   - `createPropsCode()` と `createAttrsCode()` を簡素化（`paramPrefix`オプション追加）
   - `extractReferencedVariables()` を新規追加

2. **src/core/astTransformer.ts**
   - 変数参照がある場合、ブロックスコープの代わりにIIFEで囲むように変更

3. **tests/integration/dynamic-data.test.ts**
   - TDZエラーを期待していたテストを、成功を期待するテストに変更

### 制約事項

**制約なし！** Phase 3.5の制約事項は全て解決されました。

- ✅ 同名変数の受け渡し（`navigation=navigation`）
- ✅ ネストしたコンポーネントでのバケツリレー
- ✅ 多階層のデータ伝播

### 技術的な学び

1. **IIFEの引数評価タイミングが鍵**
   - 関数呼び出しの引数は呼び出し時に評価される
   - これを利用してTDZ発生前に値をキャプチャ

2. **ブロックスコープの代替としてのIIFE**
   - 変数衝突防止という目的は同じ
   - TDZ問題を回避しつつスコープを分離

3. **シンプルな解決策が最良**
   - 複雑な一時変数パターンは不要だった
   - IIFEという既存のJavaScriptパターンで解決

---

## ✅ Phase 3.5 実装完了（2026-01-03）

> **Note:** Phase 3.5の制約事項はPhase 4で全て解決されました。

### 実装状況

**Phase 3.5: 動的データのネストしたコンポーネントへの受け渡し** が実装完了しました。

- ✅ 実装完了日: 2026-01-03
- ✅ テスト結果: **231/231 テスト合格**
- ✅ Phase 2/3 互換性: 完全維持

### 実装内容

frontmatter、CLI（`-O`）、configから渡されたデータを、ネストしたコンポーネントに変数として渡せるようになりました。Pugの変数検出機能により、参照された変数は自動的に関数パラメータに追加されます。

### 当時遭遇した問題（Phase 4で解決済み）

#### 問題: JavaScript TDZ (Temporal Dead Zone)

**現象:**  
属性名と変数名が同じ場合（例：`Layout(navigation=navigation)`）、JavaScriptのTDZによりエラーが発生。

**解決:** Phase 4のIIFEラッパーで根本解決。詳細は上記参照。

---

## 🔍 重要な発見（2025-01-03）

### データは既にコンポーネントで使用可能！

詳細な検証の結果、**データ自体はコンポーネント属性として正常に機能する**ことが判明しました：

✅ CLI `-O`のデータ → コンポーネント属性として使用可能  
✅ フロントマター直接のデータ → コンポーネント属性として使用可能  
✅ `@dataFiles`のデータ → コンポーネント属性として使用可能

**テスト例（成功）:**
```pug
---
"@dataFiles":
  - test-data.json  # {"testName": "Success"}
---

component MyComp()
  - const { name } = props
  p= name

MyComp(name=testName)  # ← これは動作する！
```

生成されるコード:
```javascript
(function (testName) {  // ← testNameが関数パラメータとして展開される
  const props = {"name": testName}  // ← 正しく参照できる
  ...
}.call(this, locals_for_with.testName))
```

---

## 当初特定されていた問題（Phase 3.5で対応完了）

### 問題1: コンポーネント展開後の変数参照消失（✅ 解決済み）

**現象:**
```pug
---
"@dataFiles":
  - ../data/navigation.json
---

include ../components/Layout.pug

Layout(navigation=navigation)  # ← エラー: Cannot access 'navigation' before initialization
```

**根本原因（修正版）:**

問題は「データが使えない」のではなく、**「コンポーネント展開後にPugが変数を認識しない」** ことです。

**処理フローと問題点:**
```
1. Pugがソースをスキャン → navigation への参照を検出
2. pug-loadがincludeを解決 → Layoutコンポーネントを読み込む
3. pug-tailがコンポーネント展開:
   Layout(navigation=navigation)
   ↓
   html
     body
       Header(navigation=navigation)  # ← この navigation への直接参照は残る
4. 問題: トップレベルの "navigation" への参照が消える
5. Pugが変数を抽出 → "navigation" が見つからない（関数パラメータに含まれない）
6. generateHTML実行 → "navigation" が未定義エラー
```

**実際の検証結果:**
```javascript
// 生成されたコード（問題あり）
function template(locals) {
  var locals_for_with = (locals || {});
  
  (function (Date, attributes, siteName) {  // ← navigation がない！
    const $props = {"navigation": navigation}  // ← 未定義エラー
    ...
  }.call(this, ...))
}
```

**影響範囲:**
- ネストされたコンポーネント構造でデータを渡す場合のみ ⚠️
- トップレベルでコンポーネントを呼び出す場合は問題なし ✅
- コンポーネント内で直接データを参照する場合は問題なし ✅

---

### 問題2: コンポーネント内でグローバルデータにアクセスできない（優先度: 低）

**現象:**
```pug
component Layout()
  Header(navigation=navigation)  # ← navigationにアクセスできない（$propsを通じて渡す必要がある）
```

**根本原因:**
コンポーネント内部では、外部スコープの変数（グローバルデータ）に直接アクセスできない。

**補足:**
- この問題は問題1の派生問題
- 問題1を解決すれば、プロップス経由でデータを渡せるようになる
- 完全な解決（グローバルスコープの導入）は将来の課題

---

## 解決策の詳細比較

### 案1: 属性値を式として保持（推奨） ⭐

**実装方針:**
属性値を即座に評価せず、Pugの式として保持し、最終的なPugコンパイル時に評価される形にする。

**技術的アプローチ:**

現在の実装（問題あり）:
```typescript
// extractAttributes() → 属性値をそのまま文字列として取得
const attributes = new Map([
  ['navigation', 'navigation'],  // ← 変数名の文字列
  ['title', '"Hello"'],          // ← リテラル値の文字列
])

// createPropsCode() → そのまま埋め込み
const props = {
  "navigation": navigation,  // ← ここでnavigationを評価（未定義！）
  "title": "Hello"
}
```

修正後の実装:
```typescript
// 属性値をCode nodeとして保持
// Pugのコンパイル時に評価される形で注入
const props = {
  get navigation() { return navigation },  // ← 遅延評価
  "title": "Hello"
}

// または、プロパティごとに個別に設定
const props = {}
props.navigation = navigation  // ← このコードがPugに埋め込まれる
props.title = "Hello"
```

**変更が必要なファイル:**
1. `src/utils/usageDetector.ts`
   - `createPropsCode()` の生成ロジック修正
   - `createAttrsCode()` の生成ロジック修正
   
2. `src/utils/attributes/createAttributesCode.ts`
   - Phase 2の`createAttributesCode()`修正
   
3. `src/core/astTransformer.ts`
   - `injectAttributes()`メソッドの小規模変更

4. テストケースの追加:
   - `tests/fixtures/dynamic-data/frontmatter-to-component.pug`
   - `tests/fixtures/dynamic-data/cli-data-to-component.pug`
   - `tests/fixtures/dynamic-data/config-data-to-component.pug`
   - `tests/fixtures/dynamic-data/nested-component-data-passing.pug`

**メリット:**
- ✅ 既存の処理フローを維持
- ✅ テストの大部分がそのまま動作
- ✅ 段階的な実装が可能
- ✅ リスクが低い

**デメリット:**
- ⚠️ 属性値の評価タイミングが変わる
- ⚠️ 一部のエッジケースで動作が変わる可能性

**影響度:** 🟡 中

**工数見積もり:** 2.5日
- Day 1: 実装とユニットテスト（1日）
- Day 2: 統合テスト・既存テスト修正（1日）
- Day 3: ドキュメント更新（0.5日）

**リスク:** 低

---

### 案2: コンポーネント展開をPugコンパイル後に実行

**実装方針:**
処理順序を根本的に変更し、データ注入後にコンポーネント展開を行う。

**新しい処理フロー:**
```
1. lex(source)
2. parse(tokens)
3. load(ast)                // include/extends解決
4. generateCode(ast)        // Pugコードを生成（コンポーネント未展開）
5. 【新】コンポーネント展開   // 生成されたコード上で展開
6. 【新】再コンパイル         // 展開後のコードを再度コンパイル
```

**変更が必要なファイル:**
- `src/transform.ts` - 処理順序の完全な再設計（10+ファイル影響）
- `src/core/astTransformer.ts` - コンパイル済みコードへの対応
- `src/core/componentRegistry.ts` - 登録タイミングの変更
- すべてのAST操作ユーティリティ
- すべてのテスト（100+ファイル）

**メリット:**
- ✅ 理論上、すべてのデータにアクセス可能
- ✅ 根本的な解決

**デメリット:**
- ❌ アーキテクチャの根本的な変更
- ❌ include/extendsとの相互作用が複雑化
- ❌ パフォーマンスへの影響（二重コンパイル）
- ❌ 実装期間が非常に長い
- ❌ 既存機能の破壊リスク

**影響度:** 🔴 非常に大

**工数見積もり:** 2-4週間

**リスク:** 非常に高

---

### 案3: データを事前にコンポーネントに注入

**実装方針:**
コンポーネント展開時にデータをリテラル値としてASTに埋め込む。

**技術的アプローチ:**
```typescript
// データを事前に読み込み
const data = { navigation: [...], siteName: "Example" }

// コンポーネント展開時に埋め込み
const props = {
  "navigation": [{"label":"Home","url":"/"},...]  // ← リテラルとして埋め込み
}
```

**変更が必要なファイル:**
- `src/transform.ts` - データ処理の前倒し（5-7ファイル影響）
- `src/core/astTransformer.ts` - データコンテキストの追加
- `src/cli.ts` - データローディングタイミングの変更
- 属性処理ロジック全体

**メリット:**
- ✅ 静的なデータなら完全に動作

**デメリット:**
- ❌ 動的データに対応できない（ループ内、条件分岐内）
- ❌ リテラル値に展開するため、コード量が増大
- ❌ 柔軟性が大きく損なわれる
- ❌ 巨大なデータセットには不適切

**影響度:** 🔴 大

**工数見積もり:** 1-2週間

**リスク:** 中（機能制限が大きい）

---

## 推奨実装プラン：Phase 3.5

### 目標

**案1（属性値を式として保持）を実装し、フロントマター/グローバルデータをコンポーネント属性として渡せるようにする**

### 実装ステップ

#### Step 1: 調査・プロトタイプ（0.5日）

**タスク:**
- 現在の属性値生成ロジックの詳細調査
- 遅延評価の実装方針を確定
- プロトタイプコードで実現可能性を検証
- エッジケースの洗い出し

**成果物:**
- 技術調査レポート
- プロトタイプコード
- 実装方針ドキュメント

---

#### Step 2: コア実装（1日）

**タスク:**

1. `src/utils/usageDetector.ts`の修正
   - `createPropsCode()`を修正し、属性値を式として保持
   - `createAttrsCode()`を修正

2. `src/utils/attributes/createAttributesCode.ts`の修正
   - Phase 2の`createAttributesCode()`を修正

3. `src/core/astTransformer.ts`の小規模変更
   - `injectAttributes()`の呼び出し方法を調整

**実装例:**
```typescript
// Before:
function createPropsCode(props: Map<string, string>): Code {
  const entries = Array.from(props.entries())
    .map(([key, val]) => `"${key}": ${val}`)  // ← そのまま埋め込み
  return {
    type: 'Code',
    val: `const props = {${entries.join(', ')}}`,
    ...
  }
}

// After:
function createPropsCode(props: Map<string, string>): Code {
  // オブジェクトリテラルではなく、個別代入に変更
  const assignments = Array.from(props.entries())
    .map(([key, val]) => `props["${key}"] = ${val}`)
  return {
    type: 'Code',
    val: `const props = {}; ${assignments.join('; ')}`,
    ...
  }
}
```

---

#### Step 3: テスト（0.5日）

**新規テストケース:**
1. `tests/fixtures/dynamic-data/frontmatter-to-component.pug`
   - フロントマターのデータをコンポーネントに渡す
   
2. `tests/fixtures/dynamic-data/cli-data-to-component.pug`
   - CLI `-O`のデータをコンポーネントに渡す
   
3. `tests/fixtures/dynamic-data/nested-component-data-passing.pug`
   - ネストされたコンポーネント間でデータを渡す

**既存テスト:**
- props-attrsテスト（8ケース）の動作確認
- attributesテスト（Phase 2）の互換性確認
- すべての統合テストの実行

---

#### Step 4: ドキュメント更新（0.5日）

**更新が必要なドキュメント:**
1. `docs/ROADMAP.md`
   - Phase 3.5の実装内容を追加
   - 使用例の追加

2. `README.md`（必要に応じて）
   - 使用例の更新

3. `docs/IMPROVEMENT-PLAN.md`（このファイル）
   - 実装結果の記録
   - 残課題の更新

---

### 合計工数見積もり

**2.5日（実働）**

- Day 1: 調査・プロトタイプ・実装（1.5日）
- Day 2: テスト・デバッグ（0.5日）
- Day 3: ドキュメント・リリース準備（0.5日）

---

## 技術的な詳細

### Pugの変数認識メカニズム

**Pugの動作（pug-code-gen）:**

Pugは、テンプレート内で**直接参照されている変数**を自動的に検出し、`locals`から取得する関数パラメータとして展開します。

```pug
# Pugソース
p= myData
each item in items
  li= item

# 生成されるコード
(function (items, myData) {  // ← Pugが自動検出
  pug_html = ...
}.call(this, 
  locals_for_with.items,
  locals_for_with.myData
))
```

### 現在の問題

**コンポーネント展開後の変数参照消失:**

```pug
# 展開前（Pugスキャン時）
Layout(navigation=navigation)  # ← navigationへの参照あり

# 展開後（コンポーネント展開完了時）
html
  body
    {
      const props = {"navigation": navigation}
      # ... ネストの深い場所に navigation 参照
    }

# 問題: トップレベルに navigation への明示的な参照がない
# → Pugが navigation を関数パラメータに含めない
# → navigation が未定義エラー
```

### 解決策

**ダミー参照の挿入:**

```pug
# 展開後に追加
//- pug-tail: ensure variables are available
- void(navigation)  # ← この1行でPugが navigation を認識！

html
  body
    {
      const props = {"navigation": navigation}  # ← 正しく参照できる
      ...
    }
```

生成されるコード:
```javascript
(function (navigation) {  // ← 関数パラメータに含まれる！
  void(navigation);  // 何もしない（最適化で削除される可能性）
  {
    const props = {"navigation": navigation}  // ← 正しく参照できる
    ...
  }
}.call(this, locals_for_with.navigation))
```

---

### 実装の詳細

#### 1. 変数の抽出

属性値から変数を識別する必要があります：

```typescript
function extractVariablesFromAttributes(
  attributes: Map<string, string>
): Set<string> {
  const vars = new Set<string>()
  
  for (const [, val] of attributes.entries()) {
    const trimmed = val.trim()
    
    // リテラル値をスキップ
    if (
      trimmed.startsWith('"') ||   // 文字列リテラル
      trimmed.startsWith("'") ||
      /^\d+(\.\d+)?$/.test(trimmed) ||  // 数値リテラル
      trimmed === 'true' ||         // 真偽値
      trimmed === 'false'
    ) {
      continue
    }
    
    // 複雑な式は基本的な変数抽出のみ
    // 例: myVar, obj.prop, arr[0] など
    // 簡易実装: スペースがなく、英数字+一部記号のみ
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.[\]]*$/.test(trimmed)) {
      // 最初の変数名のみ抽出（obj.prop → obj）
      const varName = trimmed.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)?.[0]
      if (varName) {
        vars.add(varName)
      }
    }
  }
  
  return vars
}
```

#### 2. ダミー参照の挿入位置

コンポーネント展開後のBlockの**先頭**に挿入します：

```typescript
private expandComponentCall(callNode: Node): Block {
  ...
  const componentBodyCopy = deepCloneBlock(component.body)
  const attributes = extractAttributes(callNode as Tag)
  
  // 変数参照を保持
  const referencedVars = this.extractVariablesFromAttributes(attributes)
  if (referencedVars.size > 0) {
    const dummyRef: Code = {
      type: 'Code',
      val: `void(${Array.from(referencedVars).join(', ')})`,
      buffer: false,
      mustEscape: false,
      isInline: false,
      line: 0,
      column: 0,
      filename: '',
    }
    componentBodyCopy.nodes.unshift(dummyRef)
  }
  
  this.injectAttributes(componentBodyCopy, attributes, component)
  ...
}
```

#### 3. 実行時のオーバーヘッド

`void(...)`は何も実行せず、値も返さないため、実行時のオーバーヘッドはほぼゼロです。

```javascript
void(navigation)  // 変数の値を取得するが、結果は破棄される（副作用なし）
```

---

## 変更が必要なファイル一覧

### コアファイル（1ファイルのみ）

1. **`src/core/astTransformer.ts`** 🎯
   - 変更箇所: `expandComponentCall()`メソッド
   - 追加内容: 
     - `extractVariablesFromAttributes()`ヘルパーメソッド（新規）
     - ダミー参照の挿入ロジック
   - 影響度: 🟢 非常に低
   - 行数: 約30-40行（ヘルパー含む）

### テストファイル（新規作成）

2. **`tests/fixtures/dynamic-data/nested-component-with-data.pug`** 🆕
   - ネストされたコンポーネント間でのデータ受け渡しテスト

3. **`tests/integration/dynamic-data.test.ts`** 🆕
   - 動的データの統合テスト

### ドキュメント（更新）

4. **`docs/ROADMAP.md`** - Phase 3.5の追加
5. **`docs/IMPROVEMENT-PLAN.md`** - 実装結果の記録

---

## 互換性マトリックス

### 修正前（現在）

| データソース | 使用場所 | 単純な呼び出し | ネストされた呼び出し |
|------------|---------|--------------|-----------------|
| フロントマター | テンプレート直接 | ✅ OK | ✅ OK |
| フロントマター | コンポーネント属性 | ✅ OK | ❌ エラー |
| CLI `-O` | テンプレート直接 | ✅ OK | ✅ OK |
| CLI `-O` | コンポーネント属性 | ✅ OK | ❌ エラー |
| 設定ファイル | テンプレート直接 | ✅ OK | ✅ OK |
| 設定ファイル | コンポーネント属性 | ✅ OK | ❌ エラー |
| リテラル値 | コンポーネント属性 | ✅ OK | ✅ OK |

**説明:**
- **単純な呼び出し**: トップレベルでコンポーネントを呼び出す（例: `MyComp(data=myData)`）
- **ネストされた呼び出し**: コンポーネント内で別のコンポーネントを呼び出す（例: `Layout` → `Header`）

### 修正後（Phase 3.5）

| データソース | 使用場所 | 単純な呼び出し | ネストされた呼び出し |
|------------|---------|--------------|-----------------|
| フロントマター | テンプレート直接 | ✅ OK | ✅ OK |
| フロントマター | コンポーネント属性 | ✅ OK | ✅ OK 🆕 |
| CLI `-O` | テンプレート直接 | ✅ OK | ✅ OK |
| CLI `-O` | コンポーネント属性 | ✅ OK | ✅ OK 🆕 |
| 設定ファイル | テンプレート直接 | ✅ OK | ✅ OK |
| 設定ファイル | コンポーネント属性 | ✅ OK | ✅ OK 🆕 |
| リテラル値 | コンポーネント属性 | ✅ OK | ✅ OK |

---

## 使用例（修正後）

### 例1: フロントマターのデータをネストされたコンポーネントに渡す ✨

```pug
---
"@dataFiles":
  - ../data/navigation.json
  - ../data/site.json
---

include ../components/Layout.pug

Layout(navigation=navigation siteName=siteName)
  slot(main)
    h1 Welcome to #{siteName}!
```

```pug
// components/Layout.pug
include ./Header.pug

component Layout()
  - const { navigation, siteName } = $props
  html
    head
      title= siteName
    body
      Header(navigation=navigation)  # ← これが動作する！
      slot(main)
```

```pug
// components/Header.pug
component Header()
  - const { navigation } = $props
  header
    nav
      each item in navigation
        a(href=item.url)= item.label
```

### 例2: CLI データを多層コンポーネントに渡す ✨

```bash
pug-tail pages/index.pug -o dist/ -O navigation.json
```

```pug
// pages/index.pug
include ../components/Layout.pug

Layout(navigation=navigation)
  slot(main)
    p Content
```

### 例3: 設定ファイルのデータをコンポーネントに渡す ✨

```javascript
// pug-tail.config.js
export default {
  files: {
    input: 'pages/**/*.pug',
    output: 'dist'
  },
  data: './data/global.json'
}
```

```pug
// pages/index.pug
include ../components/Layout.pug

Layout(siteConfig=siteConfig userMenu=userMenu)
  slot(main)
    p Welcome
```

---

## 今後の開発優先度

### 優先度: 最高 ⭐⭐⭐

1. **Phase 3.5: 変数参照の保持**
   - 工数: **1.5日** ← 大幅に削減！
   - リスク: **非常に低**
   - 影響: **1ファイルのみ**
   - 期待効果: ネストされたコンポーネント間でデータを渡せるようになる

### 優先度: 中 ⭐⭐

2. **エラーメッセージの改善**
   - より分かりやすいエラーメッセージ
   - スタックトレースの改善
   - 工数: 1日

3. **Watch modeの安定化**
   - 依存関係追跡の改善
   - パフォーマンス最適化
   - 工数: 2日

### 優先度: 低 ⭐

4. **問題2: グローバルスコープの完全サポート**
   - Phase 3.5で部分的に解決されるため、緊急性は低い
   - 完全な解決は将来検討
   - 工数: TBD

5. **Phase 4: 最適化**
   - constantinopleを使った定数畳み込み
   - 生成コードの最適化
   - 工数: TBD

---

## リスク管理

### Phase 3.5実装のリスク

| リスク | 影響 | 確率 | 対策 |
|--------|------|------|------|
| 既存テストの破壊 | 低 | 極小 | 追加的な変更のため、既存動作に影響なし |
| パフォーマンス低下 | 極小 | 極小 | `void()`は実質的にオーバーヘッドなし |
| 複雑な式の変数抽出失敗 | 低 | 低 | 簡易実装でカバー、必要に応じて拡張 |
| Phase 2/3互換性 | なし | なし | 追加のみで既存コードは変更なし |

### リスクの低さの理由

1. **追加のみの変更**
   - 既存のコード生成ロジックは変更なし
   - ダミー参照を1行追加するのみ

2. **影響範囲が明確**
   - 変更箇所が1ファイル、1メソッド内のみ
   - 他のモジュールへの影響なし

3. **簡易な実装**
   - 複雑な処理なし
   - デバッグが容易

---

## 将来の拡張性

Phase 3.5の実装により、以下の複雑な式もサポートされます:

1. **条件付き属性**
   ```pug
   Card(title=isAdmin ? adminTitle : userTitle)
   ```
   
2. **計算された属性値**
   ```pug
   Card(count=items.length totalPrice=items.reduce(...))
   ```

3. **関数呼び出し**
   ```pug
   Card(formattedDate=formatDate(date))
   ```

**実装方針:**
- 簡易的な変数抽出（最初の変数名のみ）
- 複雑な式の場合、主要な変数が抽出されればPugが認識可能
- 必要に応じて、正規表現パターンを拡張

---

## 技術的な背景

### なぜ今までできなかったのか？

**当初の誤解:**
データが使えないという根本的な問題があると考えていました。

**実際の発見:**
- ✅ データ自体はコンポーネント属性として使用可能
- ✅ 単純なケース（トップレベルの呼び出し）は正常に動作
- ❌ **ネストされたケースでのみ問題が発生**

**真の原因:**
Pugの変数認識メカニズムを理解していなかったため、問題の本質を見誤っていました。

**Pugの変数認識:**
```pug
# Case 1: 直接参照あり（動作する）
p= myData
MyComp(value=myData)

# Case 2: ネストの奥に参照（認識されない）
MyComp()
  # この中で myData が使われているが、
  # トップレベルに参照がないため、Pugが認識しない
```

**なぜ気づかなかったか:**
- 初期のテストケースはすべて単純な構造
- ネストされたコンポーネント構造でのテストが不足
- Pugの内部動作への理解不足

---

## 参考情報

### 関連Issue・PR

- （実装後に追記）

### 関連ドキュメント

- `docs/ROADMAP.md` - 全体のロードマップ
- `docs/CLI_IMPLEMENTATION_PROGRESS.md` - CLI実装の進捗
- `docs/debugging-handoff.md` - デバッグ履歴

---

## アーキテクチャ上の制約

### 変更できないこと

1. **処理順序**
   ```
   lex → parse → load → transform → generate
   ```
   この順序は、Pugのinclude/extendsと互換性を保つために必要

2. **AST変換ベース**
   - pug-tailはAST変換アプローチを採用
   - ランタイムライブラリは持たない（ゼロランタイム）

3. **Pugとの互換性**
   - Pugの標準機能を最大限活用
   - 独自の構文は最小限に

### Phase 3.5の位置づけ

Phase 3.5は、上記の制約内で**最大限の柔軟性を提供する**ための実装です。完全な解決ではありませんが、実用上は十分な機能を提供します。

---

## 成功の定義

Phase 3.5の実装が成功とみなされる条件:

### 機能要件
- ✅ ネストされたコンポーネント間でデータを渡せる
- ✅ すべてのデータソース（フロントマター、CLI、設定ファイル）で動作
- ✅ 単純なケース（既に動作）への影響なし
- ✅ リテラル値の動作は変更なし

### 品質要件
- ✅ すべての既存テストがパス（225件）
- ✅ 新しいテストケース（2-3件）が追加される
- ✅ Phase 2/3の互換性を維持
- ✅ 生成されるコードのサイズ増加が最小限（1行のみ）

### ドキュメント要件
- ✅ 使用例が文書化される
- ✅ 内部動作が説明される
- ✅ マイグレーションガイド不要（完全な後方互換性）

---

## 次のステップ

1. **このドキュメントのレビュー**
   - 技術的アプローチの妥当性確認
   - 工数見積もりの検証

2. **実装開始の判断**
   - 優先度の確認
   - リソースの確保

3. **実装開始**
   - Step 1: 調査・プロトタイプから開始

---

## 📊 検証結果のまとめ

### ✅ 既に動作しているケース

**ケース1: トップレベルでの呼び出し**
```pug
---
"@dataFiles":
  - test-data.json  # {"testName": "Success"}
---

component MyComp()
  - const { name } = props
  p= name

MyComp(name=testName)  # ← 動作する
```

**ケース2: 単純なネスト**
```pug
component Inner()
  - const { val } = $props
  p= val

component Outer()
  - const { data } = $props
  Inner(val=data)  # ← 動作する

Outer(data=myData)
```

### ❌ 動作しないケース

**ケース3: 多層ネスト + slot**
```pug
include ../components/Layout.pug

Layout(navigation=navigation)  # ← ここのnavigationは認識されない
```

```pug
// components/Layout.pug
component Layout()
  - const { navigation } = $props
  html
    body
      slot(header)
        Header(navigation=navigation)  # ← ネストが深い
```

**理由:** コンポーネント展開後、トップレベルに`navigation`への直接参照が残らない

---

## 将来の改善案

### 提案1: defineProps()スタイルのAPI（優先度: 中）

**提案日:** 2026-01-03

#### 現在の問題

現在の実装では、ユーザーは普通のJavaScriptとして `const { navigation } = $props` と書きますが、実際にはpug-tailが裏で特別な処理（componentDetectorによる検出）を行っています。

**ユーザーの視点:**
- JSユーザーは「分割代入をしているつもり」
- しかし実際には「pug-tailの特別な処理」
- この「魔法」が混乱を招く可能性

**問題点:**
1. **暗黙的**: 特別な処理であることが不明確
2. **予測不可能**: 通常のJavaScriptと異なる動作
3. **学習コスト**: 「なぜ$props.navigationではダメなのか」を理解する必要

#### 提案: defineProps()スタイル

Vueの `defineProps()` のような明示的なAPIを導入することで、これらの問題を解決できます。

**案1: 関数スタイル**
```pug
component Header()
  - const { navigation } = defineProps()  // 明示的なAPI呼び出し（現在は $props として実装）
  header
    nav
      each item in navigation
        a(href=item.url)= item.label
```

**案2: 宣言スタイル（Vue風）**
```pug
component Header()
  - const props = defineProps()
  - const { navigation } = props
  header
    nav
      each item in navigation
        a(href=item.url)= item.label
```

#### メリット

1. **明示性**: 「これは特別なAPI」であることが一目瞭然
2. **予測可能性**: 通常のJavaScriptと異なることが明確
3. **型安全性**: TypeScriptの型推論がより正確になる可能性
4. **学習曲線**: 「魔法」ではなく「API」として理解できる
5. **エコシステム親和性**: Vue/Reactユーザーに馴染みやすい

#### デメリット

1. **後方互換性**: 既存のコードが動かなくなる
2. **実装コスト**: componentDetectorの大幅な書き換えが必要
3. **記述量増加**: 若干冗長になる

#### 検討事項

- **移行戦略**: 段階的な導入が必要
  - Phase 1: 両方のスタイルをサポート（非推奨警告付き）
  - Phase 2: 新スタイルのみサポート（メジャーバージョンアップ）
  
- **実装方法**: 
  - `defineProps()` は実際には関数ではなく、コンパイル時マーカー
  - componentDetectorで `defineProps()` 呼び出しを検出
  - 現在の分割代入検出と同様の処理
  
- **ドキュメント更新**: 
  - 「なぜdefineProps()が必要か」の説明
  - Vue/Reactとの比較
  - 移行ガイド

#### 優先度判断

- **優先度**: 中（Phase 4以降で検討）
- **理由**: 
  - 現在の実装も動作している
  - しかし長期的にはユーザー体験の向上に貢献
  - メジャーバージョンアップのタイミングで導入が望ましい

#### 関連課題

- Phase 3の設計思想（$props/$attrs分離）との整合性
- ~~TDZ問題（Phase 3.5の制約事項）への影響~~ → **Phase 4で解決済み**
- TypeScript型定義の拡張

---

### ~~提案2: Vue風 `:` プレフィックス記法~~（Phase 4で不要に）

> **Note:** この提案はPhase 4でTDZ問題が根本解決されたため、**実装の必要性がなくなりました**。
> 以下は検討の記録として残します。

**提案日:** 2026-01-03  
**ステータス:** ❌ 不要（Phase 4でTDZ問題解決済み）

#### 当時の問題（Phase 3.5のTDZ制約）→ 解決済み

~~現在、コンポーネント属性で同名の変数を渡すとTDZエラーが発生します：~~

```pug
Layout(navigation=navigation)  ✅ Phase 4で動作するようになった！
Layout(nav=navigation)         ⭕️  OK（従来の回避策）
```

#### 提案内容（参考記録）

Vueの `v-bind` / `:` 記法を参考に、propsを渡す際の構文を導入する案でした：

```pug
Layout(:navigation=navigation)  // 明示的にpropsとして渡す
Layout(:navigation)             // 省略記法
```

**結論:** Phase 4のIIFEラッパー実装により、通常の記法（`navigation=navigation`）で動作するようになったため、この構文拡張は不要になりました。

ただし、将来的にVue親和性を高めるための**DX向上オプション**として再検討する可能性はあります：
- 省略記法 `Layout(:navigation)` は便利
- 明示性の向上
- Vueユーザーへの馴染みやすさ

#### 以下は検討時の記録（参考）

<details>
<summary>検討内容の詳細（クリックで展開）</summary>

#### 実装方法

**1. パース時の検出:**
- 属性名が `:` で始まる場合、propsとして扱う
- `:navigation` → 属性名は `navigation`、値は `locals_for_with.navigation`

**2. コード生成の変更:**

```javascript
// 現在の生成コード（TDZエラー）
{
  const $props = { navigation: navigation };
  const { navigation } = $props;
}

// 新しい生成コード（:navigation記法）
{
  const $props = { navigation: locals_for_with.navigation };  // ← 直接参照！
  const { navigation } = $props;  // ← TDZ問題なし！
}
```

**3. 省略記法のサポート:**
```pug
Layout(:navigation)
// ↓ 内部的に展開
Layout(:navigation=navigation)
```

#### メリット

1. **TDZ問題の根本解決**: `locals_for_with` から直接参照することでTDZ回避
2. **明示性**: `:` でpropsであることが明確
3. **Vue親和性**: Vueユーザーに馴染みやすい記法
4. **DX向上**: `Layout(:navigation)` の簡潔な記述
5. **後方互換性**: 既存の記法（`:` なし）も引き続き動作
6. **段階的導入**: 徐々に移行可能

#### デメリットと制約

1. **パーサー拡張**: 属性名の `:` プレフィックスの解析が必要
2. **学習コスト**: 新しい記法の説明が必要
3. **混在による混乱**: 両記法が使えることで一時的に混乱の可能性
4. **バケツリレー問題**: コンポーネント内での `:` 記法には注意が必要（後述）

#### 重要な制約: バケツリレー問題

`:` 記法は**トップレベルでのTDZ問題を解決**しますが、**コンポーネント内でのバケツリレーには別の課題**があります。

**問題のケース:**
```pug
component Parent()
  - const { data } = $props
  Child(:data=data)  # ← この :data はどこを参照？
```

**期待する動作:**
```javascript
function Parent(data, ...attrs) {
  const $props = { data: data };
  const { data } = $props;  // ローカル変数 data
  
  // Parentのローカル変数dataを渡したい
  Child({ data: data });  // ← しかしこれはTDZ問題
}
```

**もし「:は常にlocals_for_withを参照」なら:**
```javascript
function Parent(data, ...attrs) {
  const $props = { data: data };
  const { data } = $props;
  
  // トップレベルのdataを参照してしまう
  Child({ data: locals_for_with.data });  // ❌ 意図しない動作
}
```

**解決策の選択肢:**

1. **案A: `:` はトップレベル専用（推奨）**
   ```pug
   # トップレベル: : 記法を使用
   Parent(:navigation=navigation)
   
   component Parent()
     - const { navigation } = $props
     # コンポーネント内: 通常の記法（属性名を変える）
     Child(nav=navigation)  # または別の回避策
   ```

2. **案B: 一時変数での退避**
   ```javascript
   function Parent(data_param, ...attrs) {
     const _temp_data = data_param;  // TDZ前に退避
     const $props = { data: data_param };
     const { data } = $props;
     
     Child({ data: _temp_data });  // 退避した値を使う
   }
   ```
   → 実装が複雑化

3. **案C: 分割代入時にリネーム**
   ```javascript
   function Parent(data, ...attrs) {
     const $props = { data: data };
     const { data: _data } = $props;  // 内部でリネーム
     
     Child({ data: _data });  // TDZ問題なし
   }
   ```
   → componentDetectorの大幅な変更が必要

**推奨方針:**

- **`:` 記法はトップレベル専用**として設計
- コンポーネント内では通常の記法を使用（属性名を変える回避策）
- または、将来的に `defineProps()` と組み合わせて解決

**使い分けの例:**
```pug
---
"@dataFiles": ["navigation.json"]
---

component Layout()
  - const { nav } = $props
  Header(navigation=nav)  # コンポーネント内: 通常の記法

component Header()
  - const { navigation } = $props
  nav
    each item in navigation
      a(href=item.url)= item.label

# トップレベル: : 記法でTDZ回避
Layout(:nav=navigation)
```

#### 実装計画

**Phase 1: 基本実装**
- [ ] 属性パーサーで `:` プレフィックスを検出
- [ ] コード生成時に `locals_for_with` から直接参照
- [ ] 基本的なテストケース追加

**Phase 2: 省略記法**
- [ ] `:navigation` → `:navigation=navigation` の自動展開
- [ ] 省略記法のテストケース追加

**Phase 3: ドキュメント整備**
- [ ] 使い方ガイド
- [ ] TDZ問題の説明と解決策
- [ ] Vueとの比較

#### 技術的な詳細

**属性値の解釈ルール:**

| 記法 | 属性名 | 値の取得元 | 説明 |
|-----|-------|----------|------|
| `navigation=navigation` | `navigation` | 変数 `navigation` | TDZ注意 |
| `:navigation=navigation` | `navigation` | `locals_for_with.navigation` | TDZ回避 |
| `:navigation` | `navigation` | `locals_for_with.navigation` | 省略記法 |
| `class="container"` | `class` | 文字列リテラル | 通常のattrs |

**制約の簡潔なまとめ:**

```pug
# 現在の制約（Phase 3.5）
Layout(navigation=navigation)  ❌  TDZエラー
Layout(nav=navigation)         ⭕️  回避策

# 提案記法（解決）
Layout(:navigation=navigation) ⭕️  根本解決
Layout(:navigation)            ⭕️  省略記法
```

#### 優先度判断

- ~~**優先度**: 高（Phase 4で実装推奨）~~
- **ステータス**: Phase 4でTDZ問題が解決されたため不要

</details>

#### 関連課題

- ~~Phase 3の設計思想（props/attrs分離）と完全に整合~~
- ~~defineProps() 提案（提案1）との組み合わせも可能~~
- ~~TypeScript型定義への影響（`:` プレフィックスの型推論）~~

---

**最終更新:** 2026-01-03

