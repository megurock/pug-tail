// pug-tail.config.js
export default {
  // ファイル関連の設定
  files: {
    // 入力ファイル/ディレクトリ/パターン
    // 文字列または配列で指定可能
    // input: 'src/pages',
    // input: ['src/pages', 'src/templates'],
    input: 'examples/**/*.pug',

    // 出力ディレクトリ（複数ファイル）またはファイル名（単一ファイル）
    output: 'compiled',

    // 出力パスのルート（ディレクトリ構造を維持する際のベースパス）
    // 指定しない場合、入力パターンから自動的に抽出される
    // 例: root: 'examples/pages' とすると、pages をルートとして扱う
    //     examples/pages/index.pug → compiled/index.html（pages がルート）
    root: 'examples/pages',

    // ファイルレンダリングパターン
    // どの .pug ファイルを .html として出力するかを制御
    // グロブパターンと否定パターン（!）をサポート
    render: [
      '**/*.pug', // すべての .pug
      '!**/components/**/*.pug', // components ディレクトリを除外
      '!**/_*.pug', // _ 始まりを除外
      '**/index.pug', // でも index.pug は含める
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
  data: './examples/data/shared.json',

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
