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

**MVP (v1.0.0) 完了** ✅

MVP では以下の機能が実装されました：
- component 定義と slot 定義の構文
- component 呼び出しと slot 差し込み
- 複数名前付き slot
- デフォルト slot 内容
- 基本的なエラーハンドリング
- CLI インターフェース

---

## Phase 2: 高度な機能（進行中）

### Component の属性 / props サポート

#### 基本ルール

- component 呼び出し時の丸括弧は **引数ではなく attributes 指定**
- component 関数に **位置引数は存在しない**
- 入力は常に 1 系統（attributes のみ）

```pug
// OK
Card(title="Hello", count=5)

// NG（mixin 的な二段呼びは不可）
Card(title="Hello")(class="my-card")
```

#### props / attrs の判定ルール（Phase 2）

- component 内で参照（消費）された属性キー → **props 扱い**
- 消費されなかった属性 → **attrs 扱い**

```pug
component Card()
  h2= attributes.title
```

- `title` → props
- それ以外（class / id / data-* など）→ attrs

#### 公式パターン（props / attrs 分離）

```pug
component Card()
  - const {
  -   title = "Hello",
  -   count = 0,
  -   ...attrs
  - } = attributes

  .card&attributes(attrs)
    h2= title
    p Count: #{count}
```

呼び出し側：

```pug
Card(title="Hello", count=5, class="my-card")
```

---

### 属性フォールスルー（Vue 互換）

Vue と同様に、**未消費の attributes は自動的にルート要素へ適用**されます。

#### ルール

- ルート要素が 1 つの場合：
  - `&attributes` が書かれていなければ自動適用
- ルート要素が複数の場合：
  - 自動適用しない（Warning）
  - 明示的な `&attributes` が必要

```pug
component Card()
  .card
    h2= attributes.title
```

内部的には以下と等価：

```pug
.card&attributes(attributes)
```

#### class / id のマージ

- component 側の class と呼び出し側の class はマージ
- id の優先順位は仕様で定義（未確定）

---

### &attributes サポート

- Pug 標準の `&attributes` を完全サポート
- attributeBlocks と通常の attrs をマージ

```pug
- var extra = { 'data-id': '123' }
Card(title="Hello")&attributes(extra)
```

---

### Scoped slot 対応

- slot に名前付き props を渡せる
- slot props は **component → slot への出力**
- component 呼び出しの引数とは無関係

```pug
component List()
  slot(item, value=attributes.value)
```

---

## Phase 3: props 定義の導入（予定）

### @props 構文

```pug
component Card()
  @props {
    title: { type: String, default: "Hello" },
    count: { type: Number, default: 0 }
  }
```

#### ルール

- `@props` に定義されたキー → props
- それ以外 → attrs
- default / required / type チェックをサポート予定

Vue の props 定義と同等の役割を持つ。

---

## 今後の開発体験向上

- Watch mode
- Incremental build
- IDE 拡張（VSCode）
- AST 可視化・デバッグツール

---

## 注意事項

### 明示的にサポートしないこと

- component 位置引数（JS 関数的な引数）
- mixin の二段呼び構文
- 推測による props / attrs 判定（名前ベース）

---

## バージョン履歴

### v1.0.0 (MVP)

- component / slot 構文
- 複数名前付き slot
- CLI

---

**このロードマップは設計の進化に応じて随時更新されます。**

