import { defineConfig } from 'vite';

export default defineConfig({
    // プロジェクトのルートディレクトリ
    root: './',
    // ビルド後のリソースパスを相対パスにする（任意のサブディレクトリで動くように）
    base: './',
    build: {
        // 出力先ディレクトリ
        outDir: 'docs',
        // ビルド時に出力先を空にする
        emptyOutDir: true,
        // アセットの配置設定（必要に応じて）
        assetsDir: 'assets',
    }
});
