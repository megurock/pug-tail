# CLI 機能拡張 - 実装進捗

Phase A、B、C の実装が完了しました！

## 📊 全体の進捗

### Phase A: 必須機能（3-4日）✅ 完了
- [x] Step A-1: 複数ファイル/ディレクトリ処理（1-2日）✅
- [x] Step A-2: データ注入機能（1日）✅
- [x] Step A-3: basedir サポート（0.5日）✅

### Phase B: フロントマター（2-3日）✅ 完了
- [x] Step B-1: YAML フロントマターのパース（1日）✅
- [x] Step B-2: データマージロジック（1日）✅
- [x] Step B-3: transform への統合（0.5日）✅
- [x] Step B-4: `"@dataFiles"` ディレクティブ（0.5日）✅ **NEW**

### Phase C: Watch モード（2-3日）✅ 完了
- [x] Step C-1: 基本的な Watch 機能（1-2日）✅
- [x] Step C-2: 依存関係追跡（1日）✅

---

## ✅ Phase A: 必須機能（完了）

### Step A-1: 複数ファイル/ディレクトリ処理 ✅

#### 実装したファイル

1. **`src/cli/pathResolver.ts`** - パス解決ユーティリティ
   - `resolveOutputPath()` - 出力パスの計算
   - `shouldIgnoreFile()` - `_` ファイルの判定（pug-cli 互換）
   - `isPugFile()` - Pug ファイルの判定
   
2. **`src/cli/fileProcessor.ts`** - ファイル処理のコア
   - `FileProcessor` クラス
   - 単一ファイル処理
   - 複数ファイル処理
   - glob パターン対応
   - ディレクトリの再帰的処理
   
3. **`src/cli.ts`** - CLI の更新
   - 複数入力対応
   - 後方互換性の維持（単一ファイルモード）
   - 新しいオプション追加：
     - `-E, --extension` - 出力ファイル拡張子
     - `-P, --pretty` - 整形された出力
     - `-s, --silent` - サイレントモード

4. **テスト**
   - `tests/unit/cli/pathResolver.test.ts` - ユニットテスト
   - `tests/integration/cli.test.ts` - 統合テスト（14 tests）

5. **テストフィクスチャ**
   - `tests/fixtures/cli/` - 基本的な Pug ファイル
   - `tests/fixtures/cli-data/` - データファイル
   - `tests/fixtures/cli-data-test/` - データテスト用 Pug
   - `tests/fixtures/cli-with-basedir/` - basedir テスト用

#### 主要な機能

```bash
# 単一ファイル
pug-tail src/index.pug -o dist/

# 複数ファイル
pug-tail src/index.pug src/about.pug -o dist/

# ディレクトリ全体（再帰的、_ファイルは無視）
pug-tail src/ -o dist/

# Glob パターン
pug-tail "src/**/*.pug" -o dist/

# 整形された出力
pug-tail src/ -o dist/ -P
```

#### `_` ファイルの無視ルール

✅ **処理される:**
- `src/my_component.pug` (スネークケース OK)
- `src/user_profile.pug`

❌ **無視される:**
- `src/_layout.pug` (先頭に `_`)
- `src/_components/Card.pug` (パスに `/_`)

---

### Step A-2: データ注入機能 ✅

#### 実装したファイル

1. **`src/cli/dataLoader.ts`** - データ読み込み
   - `loadData()` - JSON 文字列/ファイルの読み込み
   - `mergeData()` - データのマージ

2. **`src/transform.ts`** - データオプション追加
   - `TransformOptions.data` - テンプレートに注入するデータ

3. **統合**
   - `FileProcessor` でグローバルデータをサポート
   - CLI で `-O, --obj` オプション追加

#### 使用例

```bash
# JSON ファイルから
pug-tail src/ -o dist/ -O data.json

# JSON 文字列（注: シェルエスケープに注意）
pug-tail src/ -o dist/ -O '{"title": "My Site", "year": 2025}'
```

**data.json:**
```json
{
  "siteName": "My Site",
  "year": 2025,
  "navigation": [
    { "label": "Home", "url": "/" },
    { "label": "About", "url": "/about" }
  ]
}
```

**template.pug:**
```pug
doctype html
html
  head
    title= siteName
  body
    h1 Welcome to #{siteName}
    footer
      p © #{year} #{siteName}
```

---

### Step A-3: basedir サポート ✅

#### 実装内容

CLI に `-b, --basedir` オプションを追加し、絶対パスの includes/extends を解決。

#### 使用例

```bash
pug-tail src/pages/ -o dist/ -b src/
```

**src/pages/index.pug:**
```pug
extends /layouts/_base.pug

block content
  h1 Home Page
```

**src/layouts/_base.pug:**
```pug
doctype html
html
  head
    title My Site
  body
    block content
```

basedir なしでは `/layouts/_base.pug` が見つからずエラーになりますが、basedir を指定することで正しく解決されます。

---

## ✅ Phase B: フロントマター（完了）

### Step B-1: YAML フロントマターのパース ✅

#### 実装したファイル

1. **`src/cli/frontmatterParser.ts`** - フロントマターパーサー
   - `parseFrontmatter()` - YAML フロントマターをパース
   - フロントマターを除去したコンテンツを返す
   
2. **`tests/unit/cli/frontmatterParser.test.ts`** - ユニットテスト

#### フロントマターの書式

```pug
---
title: My Page Title
description: A description of my page
author: John Doe
year: 2025
tags:
  - test
  - frontmatter
meta:
  keywords:
    - pug
    - template
---
doctype html
html
  head
    title= title
    meta(name="description" content=description)
  body
    h1= title
    p Author: #{author}
```

#### 動作

1. `---` で囲まれた YAML ブロックをパース
2. データをオブジェクトとして抽出
3. フロントマター部分を除去した Pug コードを返す
4. Pug レクサーには YAML が見えない（構文エラー回避）

---

### Step B-2: データマージロジック ✅

#### 実装内容

フロントマターデータと CLI データ（`-O` オプション）をマージ。

**優先順位:** `frontmatter > -O option`

#### 使用例

**template.pug:**
```pug
---
title: Frontmatter Title
description: From frontmatter
---
doctype html
html
  head
    title= title
    meta(name="description" content=description)
  body
    h1= title
    if siteName
      p Site: #{siteName}
```

**コマンド:**
```bash
pug-tail template.pug -o output.html -O '{"title":"CLI Title","siteName":"My Site"}'
```

**結果:**
- `title`: "Frontmatter Title" （フロントマターが優先）
- `description`: "From frontmatter" （フロントマターのみ）
- `siteName`: "My Site" （CLI データのみ）

---

### Step B-3: transform への統合 ✅

#### 実装内容

1. **`FileProcessor`** を更新
   - ファイル読み込み後、フロントマターをパース
   - データをマージ
   - クリーンな Pug コードを transform に渡す

2. **CLI 単一ファイルモード** を更新
   - 同様の処理を追加

#### 統合の流れ

```
1. ファイル読み込み
   ↓
2. parseFrontmatter(source)
   ↓ { data, content }
3. mergeData(cliData, frontmatterData)
   ↓ mergedData
4. transform(content, { data: mergedData })
   ↓
5. HTML 出力
```

---

### Step B-4: `"@dataFiles"` ディレクティブ ✅

#### 実装内容

フロントマターで外部データファイルを指定できる機能を追加。

#### `"@dataFiles"` ディレクティブ

ページ固有のデータファイルを読み込むためのディレクティブ：

```pug
---
# ページ固有データ（直接定義）
title: About Us

# 外部ファイルから読み込み（クォート必須）
"@dataFiles":
  - data/common.json
  - data/about.json
---
h1= title
p= description
```

**パス解決ルール：**

1. **相対パス（デフォルト）** - ファイルからの相対パス
   ```yaml
   "@dataFiles":
     - data/common.json       # 同じディレクトリ
     - ../shared/global.json  # 親ディレクトリ
     - ./local.json           # 明示的な相対パス
   ```

2. **絶対パス** - basedir からの絶対パス（basedir 必須）
   ```yaml
   "@dataFiles":
     - /data/common.json      # basedir/data/common.json
   ```
   ```bash
   pug-tail src/pages/about.pug -o dist/ -b src/
   ```

**データマージ順序：**
```
CLI -O → "@dataFiles" → frontmatter 直接定義
```

#### 使用例

**プロジェクト構造：**
```
project/
├── src/
│   ├── pages/
│   │   └── about.pug
│   └── data/
│       ├── common.json
│       └── about.json
```

**about.pug：**
```pug
---
# ページ固有データ
pageTitle: 私たちについて

# 共通データとページ固有データを読み込み
"@dataFiles":
  - ../data/common.json
  - ../data/about.json
---
doctype html
html
  head
    title= pageTitle
  body
    h1= pageTitle
    p= description
    footer
      p © #{year} #{siteName}
```

**data/common.json：**
```json
{
  "siteName": "My Site",
  "year": 2025
}
```

**data/about.json：**
```json
{
  "description": "We are a great company"
}
```

**コマンド：**
```bash
pug-tail src/pages/about.pug -o dist/
```

**結果：**
- `pageTitle`: "私たちについて" (frontmatter)
- `siteName`: "My Site" (common.json)
- `year`: 2025 (common.json)
- `description`: "We are a great company" (about.json)

#### ユースケース

1. **ページごとに異なるデータソース**
   - index.pug → data/index.json
   - about.pug → data/about.json + data/team.json

2. **共通データ + ページ固有データ**
   - すべてのページが common.json を読み込む
   - 各ページが独自のデータも持つ

3. **basedir を使った絶対パス**
   ```bash
   pug-tail src/pages/ -o dist/ -b src/
   ```
   ```pug
   ---
   "@dataFiles":
     - /data/common.json  # src/data/common.json
   ---
   ```

---

## ✅ Phase C: Watch モード（完了）

### Step C-1: 基本的な Watch 機能 ✅

#### 実装したファイル

1. **`src/cli/watcher.ts`** - Watch モードの実装
   - `Watcher` クラス
   - chokidar を使ったファイル監視
   - デバウンス処理
   - グレースフルシャットダウン

2. **`src/cli.ts`** - CLI の更新
   - `-w, --watch` オプション追加
   - Watch モードの統合
   - SIGINT/SIGTERM ハンドリング

#### 主要な機能

**ファイル監視:**
- ファイル変更の検知
- 新規ファイルの追加検知
- ファイル削除の検知

**デバウンス:**
- 複数の急速な変更を統合
- 100ms の遅延（調整可能）

**初回コンパイル:**
- Watch 開始時に全ファイルをコンパイル

#### 使用例

```bash
# 基本的な Watch モード
pug-tail src/ -o dist/ -w

# デバッグモードで Watch
pug-tail src/ -o dist/ -w -d

# basedir 付きで Watch
pug-tail src/pages/ -o dist/ -b src/ -w

# データ注入しながら Watch
pug-tail src/ -o dist/ -O data.json -w
```

**出力例:**
```
🔍 Watching for changes...

📦 Initial compilation...
  rendered /path/to/output/index.html
  rendered /path/to/output/about.html
✅ Ready. Watching for changes...
💡 Press Ctrl+C to stop

🔄 Updated: /path/to/src/index.pug (5ms)
✨ Added: /path/to/src/new.pug (3ms)
🗑️  Deleted: /path/to/src/old.pug
```

#### 重要な仕様

**Watch モードでは `-o` が必須:**
```bash
# ⚠️ エラー
pug-tail src/ -w
# Error: Watch mode requires output directory (-o, --out)

# ✅ OK
pug-tail src/ -o dist/ -w
```

**無視されるファイル:**
- dotfiles (`.*`)
- `node_modules/`
- `.git/`
- `_` で始まるファイル（部分テンプレート）

---

### Step C-2: 依存関係追跡 ✅

#### 実装したファイル

1. **`src/cli/dependencyTracker.ts`** - 依存関係追跡
   - `DependencyTracker` クラス
   - include/extends の解析
   - 依存グラフの構築
   - 循環依存の検出

2. **`src/cli/watcher.ts`** - 統合
   - 初回コンパイル時に依存グラフを構築
   - ファイル変更時に依存元を再コンパイル

#### 主要な機能

**依存関係の種類:**

1. **extends の追跡**
   ```pug
   // layouts/_base.pug (変更)
   html
     body
       block content
   
   // pages/index.pug (自動再コンパイル)
   extends layouts/_base.pug
   block content
     h1 Index
   ```

2. **include の追跡**
   ```pug
   // components/_header.pug (変更)
   header.header
     h1 Site Header
   
   // pages/home.pug (自動再コンパイル)
   include components/_header.pug
   main
     h1 Home
   ```

3. **多階層の依存関係**
   ```
   components/_component.pug (変更)
     ↑ include
   layouts/_layout.pug (再コンパイル)
     ↑ extends
   pages/index.pug (再コンパイル)
   pages/about.pug (再コンパイル)
   ```

#### パス解決

**相対パス:**
```pug
extends layouts/_base.pug        // ファイルからの相対
include ../components/_header.pug // 親ディレクトリ
```

**絶対パス (basedir 必須):**
```pug
extends /layouts/_base.pug       // basedir/layouts/_base.pug
include /components/_header.pug  // basedir/components/_header.pug
```

#### 使用例

**プロジェクト構造:**
```
src/
├── layouts/
│   └── _base.pug
├── components/
│   └── _header.pug
└── pages/
    ├── index.pug
    └── about.pug
```

**コマンド:**
```bash
pug-tail src/pages/ -o dist/ -b src/ -w -d
```

**初回起動:**
```
🔍 Watching for changes...

📦 Initial compilation...
  rendered dist/index.html
  rendered dist/about.html
[watch] Building dependency graph...
[watch] Found 4 pug files
[watch] /path/to/pages/index.pug -> 1 dependencies
[watch] /path/to/pages/about.pug -> 1 dependencies
✅ Ready. Watching for changes...
💡 Press Ctrl+C to stop
```

**`_base.pug` を編集したとき:**
```
[watch] File changed: src/layouts/_base.pug
[watch] 2 dependent(s) will be recompiled
[watch] /path/to/pages/index.pug depends on 1 file(s)
  rendered dist/index.html
🔄 Updated: /path/to/pages/index.pug (7ms)
[watch] /path/to/pages/about.pug depends on 1 file(s)
  rendered dist/about.html
🔄 Updated: /path/to/pages/about.pug (5ms)
```

#### 循環依存の検出

循環依存が検出された場合、警告が表示されます：

```
⚠️  Circular dependency detected in: /path/to/file.pug
```

---

## 🧪 テスト状況

### テストの種類

1. **Unit Tests** - 個別モジュールのテスト
   - `pathResolver.test.ts` - パス解決ロジック
   - `dataLoader.test.ts` - データ読み込み
   - `frontmatterParser.test.ts` - フロントマターパース

2. **Integration Tests** - CLI の統合テスト
   - 単一/複数ファイル処理
   - データ注入
   - フロントマターサポート
   - basedir サポート
   - 出力フォーマット
   - エラーハンドリング

### テスト結果

```
✅ Test Files: 24 passed
✅ Tests: 218 passed
✅ Duration: ~6s
```

すべてのテストがパスしています！

---

## 📦 追加した依存関係

```json
{
  "dependencies": {
    "glob": "^10.3.10",      // glob パターン対応
    "yaml": "^2.3.4",        // YAML フロントマターパース
    "chokidar": "^3.5.3"     // Watch モード用（Phase C）
  },
  "devDependencies": {
    "@types/glob": "^8.1.0"
  }
}
```

---

## 🎯 次のステップ: Phase C - Watch モード

### Step C-1: 基本的な Watch 機能（1-2日）

- chokidar を使ったファイル監視
- ファイル変更時の再コンパイル
- 新規ファイルの追加/削除対応

### Step C-2: 依存関係追跡（1日）

- include/extends の依存関係を追跡
- 依存ファイル変更時も再コンパイル
- 循環依存の検出

---

## 📝 使用可能な CLI オプション（現状）

```bash
pug-tail [options] [files...]

Output:
  -o, --out <dir>           Output directory (or file for single input)
  -E, --extension <ext>     Output file extension (default: .html)

Data:
  -O, --obj <str|path>      Data to inject (JSON string or file path)

Pug:
  -b, --basedir <path>      Base directory for absolute includes

Formatting:
  -P, --pretty              Pretty print HTML output
  -f, --format <format>     Output format: html, ast, pug-code (default: html)

Other:
  -d, --debug               Enable debug output
  -s, --silent              Silent mode (no log output)
  -w, --watch               Watch mode (recompile on file changes)
  -h, --help                Show help message
  -v, --version             Show version number
```

---

## 🎉 達成した目標

### Phase A の目標 ✅
- [x] pug-cli と同等の基本機能
- [x] 複数ファイル/ディレクトリ処理
- [x] データ注入
- [x] basedir サポート
- [x] 後方互換性の維持

### Phase B の目標 ✅
- [x] YAML フロントマターのパース
- [x] データマージロジック（優先順位付き）
- [x] `"@dataFiles"` ディレクティブ
- [x] 相対/絶対パス対応
- [x] 既存機能との統合
- [x] エラーハンドリング

### Phase C の目標 ✅
- [x] chokidar を使ったファイル監視
- [x] ファイル変更時の再コンパイル
- [x] include/extends の依存関係追跡
- [x] 多階層の依存関係連鎖
- [x] 循環依存の検出
- [x] デバウンス処理
- [x] グレースフルシャットダウン

### 品質 ✅
- [x] 包括的なテストカバレッジ
- [x] 型安全性
- [x] エラーメッセージの改善
- [x] デバッグモード

---

**Updated:** 2025-01-02
**Status:** Phase A, B & C Complete
**Test Status:** 224/224 Tests Passing ✅
