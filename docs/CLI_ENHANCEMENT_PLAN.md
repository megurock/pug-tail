# CLI 機能拡張実装計画

pug-tail CLI を pug-cli と同等の機能を持つように拡張する実装計画書です。

---

## 📋 目標

pug-tail CLI を以下の要件を満たすように拡張する：

1. **pug-cli パリティ** - pug-cli の基本機能をすべてサポート
2. **複数ファイル/ディレクトリ処理** - glob パターンと再帰的処理
3. **データ注入** - グローバルデータと個別データの両方
4. **フロントマター（独自機能）** - ページごとのデータ定義
5. **Watch モード** - ファイル監視と自動再コンパイル

---

## 🔍 現状分析

### pug-tail CLI の現状

```bash
pug-tail [options] <input-file>

Options:
  -o, --output <file>    出力ファイルパス
  -f, --format <format>  出力フォーマット (html|ast|pug-code)
  -d, --debug            デバッグ出力有効化
  -h, --help             ヘルプ表示
  -v, --version          バージョン表示
```

**制約:**
- ✅ 単一ファイルのトランスパイル
- ❌ 複数ファイル/ディレクトリ処理不可
- ❌ データ注入機能なし
- ❌ watch モードなし
- ❌ 依存関係追跡なし

---

### pug-cli との比較

| 機能 | pug-cli | pug-tail (現状) | pug-tail (目標) |
|------|---------|----------------|----------------|
| 単一ファイル処理 | ✅ | ✅ | ✅ |
| 複数ファイル処理 | ✅ | ❌ | ✅ |
| ディレクトリ再帰 | ✅ | ❌ | ✅ |
| glob パターン | ❌ | ❌ | ✅ |
| データ注入 (-O) | ✅ | ❌ | ✅ |
| Watch モード | ✅ | ❌ | ✅ |
| 依存関係追跡 | ✅ | ❌ | ✅ |
| stdin/stdout | ✅ | ❌ | ⏸️ |
| `_` ファイル無視 | ✅ | ❌ | ✅ |
| フロントマター | ❌ | ❌ | ✅ |

---

## 🎯 実装する機能

### Phase A: 必須機能（pug-cli パリティ）

#### 1. 複数ファイル/ディレクトリ処理

**glob パターンサポート:**
```bash
# 単一ファイル
pug-tail src/index.pug -o dist/

# 複数ファイル
pug-tail src/index.pug src/about.pug -o dist/

# glob パターン
pug-tail "src/**/*.pug" -o dist/

# ディレクトリ（すべての .pug を再帰的に処理）
pug-tail src/ -o dist/
```

**実装ポイント:**
- `glob` パッケージを使用
- `.pug`, `.jade` 拡張子をサポート
- `_` プレフィックスのファイルは無視
- ディレクトリ構造を維持して出力

---

#### 2. データ注入 (-O, --obj)

**グローバルデータの注入:**
```bash
# 文字列として JSON を指定
pug-tail src/ -o dist/ -O '{"siteName": "My Site", "year": 2025}'

# JSON ファイルを指定
pug-tail src/ -o dist/ -O data.json

# JavaScript ファイルを指定（CommonJS exports）
pug-tail src/ -o dist/ -O data.js
```

**`data.json` 例:**
```json
{
  "siteName": "My Site",
  "navigation": [
    {"label": "Home", "url": "/"},
    {"label": "About", "url": "/about"}
  ],
  "year": 2025
}
```

**`data.js` 例:**
```javascript
module.exports = {
  siteName: "My Site",
  getYear: () => new Date().getFullYear()
}
```

**実装ポイント:**
- JSON 文字列のパース
- JSON/JavaScript ファイルの読み込み
- エラーハンドリング

---

#### 3. `_` プレフィックスファイル無視

**規則:**
```
src/
  index.pug           → dist/index.html ✅
  about.pug           → dist/about.html ✅
  _layout.pug         → 無視 ❌
  components/
    _Card.pug         → 無視 ❌
    Button.pug        → dist/components/Button.html ✅
```

**判定ロジック:**
```typescript
function shouldIgnore(filepath: string): boolean {
  const basename = path.basename(filepath)
  // ファイル名が _ で始まる
  if (basename.startsWith('_')) return true
  
  // パスの途中に _directory が含まれる
  const parts = filepath.split(path.sep)
  return parts.some(part => part.startsWith('_'))
}
```

---

#### 4. basedir サポート (-b, --basedir)

**include/extends の絶対パス解決:**
```bash
pug-tail src/pages/index.pug -b src/ -o dist/
```

**`src/pages/index.pug`:**
```pug
include /layouts/_base.pug
  
block content
  h1 Home
```

`-b src/` により `/layouts/_base.pug` → `src/layouts/_base.pug` に解決される

---

### Phase B: pug-tail 独自機能

#### 5. YAML フロントマター

**仕様:**

**記法:**
```pug
//- ---
//- title: Home Page
//- description: Welcome to my site
//- author:
//-   name: John Doe
//-   email: john@example.com
//- tags: [home, main]
//- published: true
//- date: 2025-01-01
//- ---

doctype html
html
  head
    title= title
    meta(name="description" content=description)
  body
    h1= title
    p by #{author.name}
```

**重要な特性:**

1. **Pug 互換** - 従来の pug でコンパイルしてもエラーにならない
   ```pug
   //- はコメントとして扱われる
   ```

2. **HTML 出力に含まれない** - フロントマター部分は削除してからコンパイル
   ```html
   <!DOCTYPE html>
   <html>
     <head>
       <title>Home Page</title>
       <meta name="description" content="Welcome to my site">
     </head>
     <body>
       <h1>Home Page</h1>
       <p>by John Doe</p>
     </body>
   </html>
   ```
   
   ✅ フロントマターのコメントは出力されない

3. **YAML サポート** - 複雑なデータ構造も扱える
   ```yaml
   navigation:
     - label: Home
       url: /
     - label: About
       url: /about
   ```

**パース処理:**
```typescript
function extractFrontmatter(source: string): {
  data: Record<string, unknown>
  content: string
} {
  // //- --- で始まり //- --- で終わるブロックを抽出
  const regex = /^\/\/- ---\n((?:\/\/- .*\n)*?)\/\/- ---\n/
  const match = source.match(regex)
  
  if (!match) {
    return { data: {}, content: source }
  }
  
  // //- プレフィックスを削除
  const yamlContent = match[1].replace(/^\/\/- /gm, '')
  const data = yaml.parse(yamlContent)
  
  // フロントマター部分を削除したコンテンツ
  const content = source.slice(match[0].length)
  
  return { data, content }
}
```

**データのマージ優先度:**
```
高 ← フロントマター ← -O オプション → 低
```

**例:**
```bash
# globals.json
{ "siteName": "My Site", "title": "Default Title" }

# page.pug
//- ---
//- title: Custom Page
//- author: John
//- ---
```

**結果:**
```javascript
{
  siteName: "My Site",   // globals.json から
  title: "Custom Page",  // フロントマターが上書き
  author: "John"         // フロントマター独自
}
```

**CLI オプション:**
```bash
--frontmatter          # フロントマター有効化（デフォルト）
--no-frontmatter       # フロントマター無効化
```

---

### Phase C: 便利機能（後回し）

#### 6. Watch モード

**基本的な監視:**
```bash
pug-tail src/ -o dist/ -w
```

**機能:**
- ファイル変更を検知
- 自動的に再コンパイル
- エラーが発生してもプロセスを終了しない

**依存関係追跡:**
```pug
//- src/pages/index.pug
include ../layouts/_base.pug

block content
  h1 Home
```

`_base.pug` が変更された場合、`index.pug` も自動的に再コンパイル

**実装ライブラリ候補:**
- `chokidar` - ファイル監視
- Pug の依存関係情報を活用

**Auto Reload（要検討）:**
```bash
pug-tail src/ -o dist/ -w --livereload
```

- ブラウザの自動リロード
- livereload サーバーの起動
- WebSocket 経由で更新通知

**注意:** これはスコープが大きいので、別フェーズとして検討

---

## 🎨 CLI オプション設計

### 完全な CLI 仕様

```bash
pug-tail [options] [files...]

Arguments:
  files...                    入力ファイルまたはディレクトリ（glob パターン可）

Options:
  # 出力関連
  -o, --out <dir>             出力ディレクトリ
  -E, --extension <ext>       出力ファイル拡張子 (デフォルト: .html)
  
  # データ関連
  -O, --obj <str|path>        グローバルデータ（JSON文字列 or ファイルパス）
  --frontmatter               フロントマター有効化 (デフォルト: true)
  --no-frontmatter            フロントマター無効化
  
  # Pug オプション
  -b, --basedir <path>        include/extends の解決に使うルートディレクトリ
  -P, --pretty                整形された HTML 出力
  
  # pug-tail 独自
  -f, --format <format>       出力フォーマット (html|ast|pug-code, デフォルト: html)
  
  # Watch（Phase C）
  -w, --watch                 ファイル監視モード
  
  # その他
  -d, --debug                 デバッグ出力有効化
  -s, --silent                ログ出力抑制
  -h, --help                  ヘルプ表示
  -v, --version               バージョン表示
```

### 使用例

```bash
# 単一ファイル
pug-tail src/index.pug -o dist/

# 複数ファイル
pug-tail src/index.pug src/about.pug -o dist/

# glob パターン
pug-tail "src/**/*.pug" -o dist/

# ディレクトリ
pug-tail src/ -o dist/

# データ注入（文字列）
pug-tail src/ -o dist/ -O '{"siteName": "My Site"}'

# データ注入（ファイル）
pug-tail src/ -o dist/ -O data.json

# フロントマター + グローバルデータ
pug-tail src/ -o dist/ -O globals.json

# basedir 指定
pug-tail src/pages/ -o dist/ -b src/

# 整形された出力
pug-tail src/ -o dist/ -P

# デバッグモード
pug-tail src/ -o dist/ -d

# Watch モード（Phase C）
pug-tail src/ -o dist/ -w

# 複合例
pug-tail src/ -o dist/ -O data.json -P -b src/ -w
```

---

## 📅 実装フェーズ

### Phase A: 基本機能拡張（3-4日）

#### Step A-1: 複数ファイル/ディレクトリ処理（1-2日）

**タスク:**
- [ ] `glob` パッケージの導入
- [ ] ファイル探索ロジックの実装
- [ ] ディレクトリの再帰的処理
- [ ] `_` プレフィックスファイルの無視
- [ ] 出力パス計算ロジック
- [ ] ディレクトリ構造の維持

**実装ファイル:**
- `src/cli/fileProcessor.ts` - ファイル処理のコア
- `src/cli/pathResolver.ts` - パス解決ユーティリティ

**テスト:**
```typescript
describe('File Processing', () => {
  it('should process single file', () => { ... })
  it('should process multiple files', () => { ... })
  it('should process directory recursively', () => { ... })
  it('should handle glob patterns', () => { ... })
  it('should ignore _ prefixed files', () => { ... })
  it('should maintain directory structure', () => { ... })
})
```

---

#### Step A-2: データ注入機能（1日）

**タスク:**
- [ ] `-O, --obj` オプションの追加
- [ ] JSON 文字列のパース
- [ ] JSON ファイルの読み込み
- [ ] JavaScript ファイルの読み込み
- [ ] エラーハンドリング

**実装ファイル:**
- `src/cli/dataLoader.ts` - データ読み込みロジック

**テスト:**
```typescript
describe('Data Loading', () => {
  it('should parse JSON string', () => { ... })
  it('should load JSON file', () => { ... })
  it('should load JavaScript file', () => { ... })
  it('should handle invalid JSON', () => { ... })
  it('should handle missing file', () => { ... })
})
```

---

#### Step A-3: basedir サポート（0.5日）

**タスク:**
- [ ] `-b, --basedir` オプションの追加
- [ ] Pug の `basedir` オプションへの渡し

**実装:**
```typescript
const transformOptions: TransformOptions = {
  filename: inputPath,
  basedir: program.basedir,
  // ...
}
```

---

### Phase B: フロントマター機能（2-3日）

#### Step B-1: フロントマターのパース（1日）

**タスク:**
- [ ] `yaml` パッケージの導入
- [ ] フロントマター抽出ロジック
- [ ] YAML パース処理
- [ ] エラーハンドリング

**実装ファイル:**
- `src/frontmatter/parser.ts` - フロントマターパーサー

**テスト:**
```typescript
describe('Frontmatter Parser', () => {
  it('should extract frontmatter', () => { ... })
  it('should parse YAML content', () => { ... })
  it('should handle missing frontmatter', () => { ... })
  it('should handle invalid YAML', () => { ... })
  it('should remove frontmatter from source', () => { ... })
})
```

---

#### Step B-2: データマージロジック（1日）

**タスク:**
- [ ] グローバルデータとフロントマターのマージ
- [ ] 優先度処理（フロントマター > グローバル）
- [ ] `--no-frontmatter` オプションのサポート

**実装ファイル:**
- `src/frontmatter/merger.ts` - データマージロジック

**テスト:**
```typescript
describe('Data Merger', () => {
  it('should merge global and frontmatter data', () => { ... })
  it('should prioritize frontmatter over global', () => { ... })
  it('should handle missing frontmatter', () => { ... })
  it('should handle missing global data', () => { ... })
})
```

---

#### Step B-3: transform への統合（0.5日）

**タスク:**
- [ ] `transform` 関数にデータオプションを追加
- [ ] Pug の locals にデータを渡す

**実装:**
```typescript
export interface TransformOptions {
  // ... existing options
  data?: Record<string, unknown>  // 追加
}

function transform(source: string, options: TransformOptions) {
  // フロントマターを抽出
  const { data: frontmatterData, content } = extractFrontmatter(source)
  
  // データをマージ
  const mergedData = mergeFrontmatterData(options.data, frontmatterData)
  
  // Pug にデータを渡す
  const html = pug.render(transformedPug, {
    ...mergedData,
    // ... other options
  })
}
```

---

### Phase C: Watch モード（2-3日、後回し）

#### Step C-1: 基本的な Watch 機能（1-2日）

**タスク:**
- [ ] `chokidar` パッケージの導入
- [ ] ファイル監視の実装
- [ ] 変更検知時の再コンパイル
- [ ] エラーハンドリング（プロセス継続）

---

#### Step C-2: 依存関係追跡（1日）

**タスク:**
- [ ] Pug の依存関係情報の取得
- [ ] include/extends されたファイルの監視
- [ ] 依存ファイル変更時の再コンパイル

---

#### Step C-3: Auto Reload（要検討）

**検討項目:**
- LiveReload サーバーの起動
- WebSocket 経由の通知
- ブラウザ側のスクリプト注入
- スコープが大きいため、別プロジェクトとして検討

---

## 🔧 技術的詳細

### 依存関係

**新規追加:**
```json
{
  "dependencies": {
    "glob": "^10.3.10",        // glob パターンマッチング
    "yaml": "^2.3.4",          // YAML パース
    "chokidar": "^3.5.3"       // ファイル監視（Phase C）
  }
}
```

**既存:**
- `pug` - Pug コンパイラ
- `@babel/parser`, `@babel/traverse` - JavaScript パース（Phase 3 で導入済み）

---

### ファイル構成

```
src/
├── cli.ts                    # CLI エントリーポイント（既存）
├── cli/
│   ├── fileProcessor.ts      # ファイル処理（新規）
│   ├── pathResolver.ts       # パス解決（新規）
│   ├── dataLoader.ts         # データ読み込み（新規）
│   └── watcher.ts            # Watch モード（Phase C）
├── frontmatter/
│   ├── parser.ts             # フロントマターパーサー（新規）
│   └── merger.ts             # データマージロジック（新規）
└── transform.ts              # トランスフォーマー（既存、データオプション追加）
```

---

### エラーハンドリング

**原則:**
1. **単一ファイルのエラーで全体を止めない**
   ```typescript
   for (const file of files) {
     try {
       await processFile(file)
     } catch (error) {
       console.error(`Error processing ${file}:`, error)
       // 次のファイルへ継続
     }
   }
   ```

2. **エラーメッセージの改善**
   ```typescript
   // ❌ Bad
   throw new Error('Parse error')
   
   // ✅ Good
   throw new Error(
     `Failed to parse frontmatter in ${filename}:\n` +
     `  ${error.message}\n` +
     `  Line ${error.line}, Column ${error.column}`
   )
   ```

3. **Watch モードではエラーでプロセス終了しない**
   ```typescript
   watcher.on('change', async (filepath) => {
     try {
       await processFile(filepath)
       console.log(chalk.green('✓'), `Compiled ${filepath}`)
     } catch (error) {
       console.error(chalk.red('✗'), `Error in ${filepath}:`)
       console.error(error.message)
       // プロセスは継続
     }
   })
   ```

---

## 🧪 テスト戦略

### テストの種類

#### Unit Tests
各モジュールの単体テスト

```typescript
// tests/unit/frontmatter/parser.test.ts
describe('Frontmatter Parser', () => {
  it('should extract frontmatter', () => {
    const source = `//- ---
//- title: Test
//- ---
h1 Hello`
    const result = extractFrontmatter(source)
    expect(result.data).toEqual({ title: 'Test' })
    expect(result.content).toBe('h1 Hello')
  })
})
```

#### Integration Tests
複数モジュールの統合テスト

```typescript
// tests/integration/cli.test.ts
describe('CLI Integration', () => {
  it('should process directory with frontmatter', async () => {
    // fixtures/src/ に .pug ファイルを配置
    // CLI を実行
    // 出力を検証
  })
})
```

#### E2E Tests
実際の CLI 実行テスト

```typescript
// tests/e2e/cli.test.ts
describe('CLI E2E', () => {
  it('should compile project', () => {
    execSync('pug-tail fixtures/src/ -o fixtures/dist/')
    // 出力ファイルの存在確認
    // HTML の内容検証
  })
})
```

---

### テストフィクスチャ

```
tests/fixtures/
├── src/
│   ├── index.pug              # フロントマターあり
│   ├── about.pug              # フロントマターあり
│   ├── _layout.pug            # 無視されるべき
│   ├── components/
│   │   ├── _Card.pug          # 無視されるべき
│   │   └── Button.pug         # 処理されるべき
│   └── nested/
│       └── page.pug           # ネストされたページ
├── data/
│   ├── globals.json           # グローバルデータ
│   └── globals.js             # JavaScript データ
└── expected/
    ├── index.html             # 期待される出力
    ├── about.html
    ├── components/
    │   └── Button.html
    └── nested/
        └── page.html
```

---

## 📚 使用例とサンプル

### サンプルプロジェクト構成

```
my-site/
├── src/
│   ├── index.pug
│   ├── about.pug
│   ├── blog/
│   │   ├── post-1.pug
│   │   └── post-2.pug
│   ├── _layouts/
│   │   └── base.pug
│   └── _components/
│       ├── Card.pug
│       └── Button.pug
├── data/
│   └── site.json
└── dist/                     # 出力先
```

---

### サンプル: `src/index.pug`

```pug
//- ---
//- title: Home Page
//- description: Welcome to my site
//- keywords: [home, main, landing]
//- author:
//-   name: John Doe
//-   email: john@example.com
//- ---

include /_layouts/base.pug

block content
  section.hero
    h1= title
    p= description
    
  section.features
    each feature in features
      include /_components/Card.pug
```

---

### サンプル: `data/site.json`

```json
{
  "siteName": "My Awesome Site",
  "baseUrl": "https://example.com",
  "navigation": [
    {"label": "Home", "url": "/"},
    {"label": "About", "url": "/about"},
    {"label": "Blog", "url": "/blog"}
  ],
  "features": [
    {
      "title": "Fast",
      "description": "Lightning fast performance"
    },
    {
      "title": "Modern",
      "description": "Built with modern technologies"
    }
  ],
  "year": 2025
}
```

---

### コンパイルコマンド

```bash
# 開発時
pug-tail src/ -o dist/ -O data/site.json -P -b src/

# 本番時
pug-tail src/ -o dist/ -O data/site.json -b src/

# Watch モード（Phase C）
pug-tail src/ -o dist/ -O data/site.json -P -b src/ -w
```

---

### 出力結果

**`dist/index.html`:**
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Home Page - My Awesome Site</title>
    <meta name="description" content="Welcome to my site">
    <meta name="keywords" content="home, main, landing">
  </head>
  <body>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/blog">Blog</a>
    </nav>
    
    <section class="hero">
      <h1>Home Page</h1>
      <p>Welcome to my site</p>
    </section>
    
    <section class="features">
      <div class="card">
        <h3>Fast</h3>
        <p>Lightning fast performance</p>
      </div>
      <div class="card">
        <h3>Modern</h3>
        <p>Built with modern technologies</p>
      </div>
    </section>
    
    <footer>
      <p>© 2025 My Awesome Site</p>
    </footer>
  </body>
</html>
```

**重要:** フロントマターのコメントは出力に含まれない ✅

---

## 🎯 成功基準

### Phase A（必須）
- [ ] 複数ファイル/ディレクトリが処理できる
- [ ] glob パターンが動作する
- [ ] `_` プレフィックスファイルが無視される
- [ ] `-O` オプションでデータが注入できる
- [ ] `-b` オプションで basedir が設定できる
- [ ] ディレクトリ構造が維持される
- [ ] すべてのテストがパス

### Phase B（フロントマター）
- [ ] フロントマターが正しくパースされる
- [ ] データのマージが正しく動作する
- [ ] フロントマターが HTML 出力に含まれない
- [ ] `--no-frontmatter` オプションが動作する
- [ ] エラーハンドリングが適切
- [ ] すべてのテストがパス

### Phase C（Watch）
- [ ] ファイル変更が検知される
- [ ] 自動的に再コンパイルされる
- [ ] 依存関係が追跡される
- [ ] エラーでプロセスが終了しない
- [ ] すべてのテストがパス

---

## 📝 実装時の注意事項

### 1. 既存機能を壊さない

現在の単一ファイル処理は引き続き動作する必要があります：

```bash
# これは引き続き動作すべき
pug-tail input.pug -o output.html
pug-tail input.pug -f ast -o output.json
```

---

### 2. Progressive Enhancement

機能は段階的に追加します：
1. Phase A を完了してから Phase B へ
2. 各 Step を完了してから次へ
3. 各 Step でテストを書いて検証

---

### 3. エラーメッセージの品質

ユーザーフレンドリーなエラーメッセージ：

```typescript
// ❌ Bad
Error: Invalid

// ✅ Good
Error: Failed to parse frontmatter in src/index.pug:
  Unexpected token at line 3, column 5
  Expected ':', got '-'
  
//- ---
//- title- Home
//       ^
```

---

### 4. パフォーマンス

大量のファイルを処理する場合のパフォーマンスに注意：
- ファイル読み込みの並列化
- キャッシュの活用
- 不要な再コンパイルを避ける

---

## 🚀 リリース計画

### v3.1.0 - Phase A（必須機能）
- 複数ファイル/ディレクトリ処理
- glob パターンサポート
- データ注入 (-O)
- basedir サポート

### v3.2.0 - Phase B（フロントマター）
- YAML フロントマター
- データマージ機能

### v3.3.0 - Phase C（Watch）
- Watch モード
- 依存関係追跡

### v3.4.0 - 将来（検討中）
- Auto Reload / LiveReload
- より高度な Watch 機能

---

**このドキュメントは実装の進行に応じて更新されます。**
