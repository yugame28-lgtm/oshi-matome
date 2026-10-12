import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   // 開発サーバーの設定
   server: {
    // /api で始まる通信を、Express(ポート3000)に中継する
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
})

