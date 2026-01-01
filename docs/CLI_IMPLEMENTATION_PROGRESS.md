# CLI 機能拡張 - 実装進捗

Phase A-1 の実装が完了しました。

## ✅ Phase A-1: 複数ファイル/ディレクトリ処理（完了）

### 実装したファイル

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

4. **`tests/unit/cli/pathResolver.test.ts`** - ユニットテスト
   - `shouldIgnoreFile()` のテスト
   - `isPugFile()` のテスト
   - `resolveOutputPath()` のテスト

5. **テストフィクスチャ**
   - `tests/fixtures/cli/index.pug`
   - `tests/fixtures/cli/about.pug`
   - `tests/fixtures/cli/_layout.pug` (無視対象)
   - `tests/fixtures/cli/user_profile.pug` (スネークケース)

### 追加した依存関係

```json
{
  "dependencies": {
    "glob": "^10.3.10",
    "yaml": "^2.3.4",      // Phase B 用
    "chokidar": "^3.5.3"   // Phase C 用
  },
  "devDependencies": {
    "@types/glob": "^8.1.0"
  }
}
```

### 主要な機能

#### 1. 複数ファイル処理

実際の fixtures ディレクトリを使った実行例：

```bash
# 単一ファイル
pug-tail tests/fixtures/cli/index.pug -o /tmp/output/
# → /tmp/output/index.html

# 複数ファイル
pug-tail tests/fixtures/cli/index.pug tests/fixtures/cli/about.pug -o /tmp/output/
# → /tmp/output/index.html
# → /tmp/output/about.html

# スネークケースのファイル（処理される）
pug-tail tests/fixtures/cli/user_profile.pug -o /tmp/output/
# → /tmp/output/user_profile.html ✅

# _ で始まるファイル（無視される）
pug-tail tests/fixtures/cli/_layout.pug -o /tmp/output/
# → 無視される（出力なし）❌

# ディレクトリ全体（再帰的）
pug-tail tests/fixtures/cli/ -o /tmp/output/
# → /tmp/output/index.html ✅
# → /tmp/output/about.html ✅
# → /tmp/output/user_profile.html ✅
# → _layout.pug は無視 ❌

# 整形された出力
pug-tail tests/fixtures/cli/index.pug -o /tmp/output/ -P

# デバッグモード
pug-tail tests/fixtures/cli/ -o /tmp/output/ -d
```

#### 2. `_` ファイルの正しい無視ルール

pug-cli と同じ動作：

✅ **処理される:**
- `src/my_component.pug` (スネークケース OK)
- `src/user_profile.pug`

❌ **無視される:**
- `src/_layout.pug` (先頭に `_`)
- `src/_components/Card.pug` (パスに `/_`)

#### 3. ディレクトリ構造の維持

```
src/
├── index.pug
└── pages/
    └── about.pug

↓ pug-tail src/ -o dist/

dist/
├── index.html
└── pages/
    └── about.html
```

#### 4. 後方互換性

単一ファイルモードも引き続き動作：

```bash
# 従来通り動作
pug-tail input.pug -o output.html
pug-tail input.pug -f ast -o output.json
```

### テスト結果

```bash
npm test
```

- pathResolver のユニットテスト: ✅ すべてパス
- 既存テスト: ✅ 壊れていない

### 次のステップ

**Step A-2: データ注入機能（-O, --obj）**

1. JSON 文字列のパース
2. JSON/JavaScript ファイルの読み込み
3. データの注入
4. テストの作成

推定時間: 1日

---

## 📊 全体の進捗

### Phase A: 必須機能（3-4日）
- [x] Step A-1: 複数ファイル/ディレクトリ処理（1-2日）✅
- [ ] Step A-2: データ注入機能（1日）
- [ ] Step A-3: basedir サポート（0.5日）

### Phase B: フロントマター（2-3日）
- [ ] Step B-1: フロントマターのパース（1日）
- [ ] Step B-2: データマージロジック（1日）
- [ ] Step B-3: transform への統合（0.5日）

### Phase C: Watch モード（2-3日、後回し）
- [ ] Step C-1: 基本的な Watch 機能（1-2日）
- [ ] Step C-2: 依存関係追跡（1日）

---

**Updated:** 2025-01-01
