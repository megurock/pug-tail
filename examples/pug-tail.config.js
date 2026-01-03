// pug-tail.config.js
//
// パス解決ルール (Path Resolution Rules):
//
// 1. 設定ファイルがある場合 (Vite 方式)
//    - この設定ファイル内のパスは、設定ファイルの場所からの相対パスとして解釈される
//    - 例: この設定ファイルは examples/ にあるため、
//          input: '**/*.pug' は examples/**/*.pug を意味する
//          output: '../compiled' は examples/../compiled つまり compiled を意味する
//
// 2. 設定ファイルがない場合 (Webpack/ESLint 方式)
//    - CLI オプションのパスは process.cwd() (コマンド実行場所) からの相対パス
//    - npm run 経由: package.json の場所が基準
//    - 直接実行: シェルのカレントディレクトリが基準
//
export default {
  // ファイル関連の設定
  files: {
    // 入力ファイル/ディレクトリ/パターン
    // 文字列または配列で指定可能
    // input: 'src/pages',
    // input: ['src/pages', 'src/templates'],
    input: '**/*.pug',

    // 出力ディレクトリ（複数ファイル）またはファイル名（単一ファイル）
    output: '../compiled',

    // 出力パスのルート（ディレクトリ構造を維持する際のベースパス）
    // 指定しない場合、入力パターンから自動的に抽出される
    // 例: root: 'pages' とすると、pages をルートとして扱う
    //     pages/index.pug → compiled/index.html（pages がルート）
    root: 'pages',

    // ファイルレンダリングパターン
    // どの .pug ファイルを .html として出力するかを制御
    // グロブパターンと否定パターン（!）をサポート
    // デフォルト: ['**/*.pug', '!**/_*.pug', '!**/*.component.pug', '!**/components/**/*.pug']
    render: [
      '**/*.pug', // すべての .pug
      '!**/_*.pug', // _ 始まりを除外（Pug標準）
      '!**/*.component.pug', // 命名規則によるコンポーネントを除外
      '!**/components/**/*.pug', // components ディレクトリを除外
    ],
  },

  // 出力ファイル拡張子（デフォルト: .html）
  extension: '.html',

  // 絶対パスの include のベースディレクトリ
  basedir: '.',

  // 使用する doctype
  doctype: 'html',

  // HTML を整形して出力
  pretty: true,

  // 出力形式: 'html' | 'ast' | 'pug-code'
  format: 'html',

  // 注入するデータ
  // JSON 文字列、ファイルパス、またはオブジェクトで指定可能
  // data: '{"title": "My Site"}',
  // data: './data.json',
  // data: { title: 'My Site', author: 'John Doe' },
  data: './data/shared.json',

  // ウォッチモード設定
  watch: {
    enabled: false, // ウォッチモードを有効化する場合は true
    debounce: 300, // デバウンス遅延（ミリ秒）
  },

  // サイレントモード（ログ出力なし）
  silent: false,

  // デバッグ出力を有効化
  debug: false,
}
