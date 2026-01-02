// pug-tail.config.js
export default {
  files: {
    includes: [
      '**/*.pug', // すべての .pug
      '!**/components/**/*.pug', // components ディレクトリを除外
      '!**/_*.pug', // _ 始まりを除外
      '**/index.pug', // でも index.pug は含める
    ],
  },
}
