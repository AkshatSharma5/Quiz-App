import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

function localApiPlugin() {
  return {
    name: 'quizup-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = req.url?.split('?')[0]
        if (!['/api/gemini', '/api/mcp'].includes(route)) return next()
        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk
            if (body.length > 30000) {
              res.statusCode = 413
              return res.end(JSON.stringify({ error: 'Request body is too large.' }))
            }
          }
          req.body = body ? JSON.parse(body) : undefined
          res.setHeader('content-type', 'application/json; charset=utf-8')
          const modulePath = route === '/api/gemini' ? 'api/gemini.js' : 'api/mcp.js'
          const handler = (await import(pathToFileURL(path.resolve(currentDirectory, modulePath)).href)).default
          await handler(req, res)
        } catch (error) {
          if (!res.headersSent) res.statusCode = 400
          if (!res.writableEnded) res.end(JSON.stringify({ error: error.message || 'Local API request failed.' }))
        }
      })
    },
  }
}
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, process.cwd(), '')
  if (serverEnv.GEMINI_API_KEY) process.env.GEMINI_API_KEY = serverEnv.GEMINI_API_KEY
  if (serverEnv.FIREBASE_PROJECT_ID) process.env.FIREBASE_PROJECT_ID = serverEnv.FIREBASE_PROJECT_ID
  if (serverEnv.FIREBASE_API_KEY) process.env.FIREBASE_API_KEY = serverEnv.FIREBASE_API_KEY
  return {
  plugins: [react(), localApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(currentDirectory, "./src"),
    },
  },
  }
})
