import { createServer } from 'node:http'
import { appendFileSync, createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = join(process.cwd(), 'dist')
const host = process.env.HOST || '0.0.0.0'
const port = Number(process.env.PORT || 5173)
const logFile = join(process.cwd(), 'static-server.log')
const COOKIE_PURGE_PREFIXES = [
  'fizzia-admin-dashboard-cache',
  'fizzia-admin-clients-cache',
  'fizzia-admin-developers-cache',
  'fizzia-admin-payments-cache',
  'fizzia-admin-finance-cache',
  'fizzia-client-dashboard-cache',
  'fizzia-client-finances-cache',
  'fizzia-developer-dashboard-cache',
  'fizzia-developer-finance-cache',
]

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

function resolvePath(url) {
  const cleanPath = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname)
  const normalized = normalize(cleanPath).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(root, normalized)
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  return join(root, 'index.html')
}

function log(message) {
  appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`)
}

process.on('uncaughtException', (error) => {
  log(`uncaughtException ${error.stack || error.message}`)
})

process.on('unhandledRejection', (error) => {
  log(`unhandledRejection ${error?.stack || error}`)
})

function expiredCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim().split('=')[0])
    .filter(Boolean)
    .filter((name) => {
      let decoded = name
      try {
        decoded = decodeURIComponent(name)
      } catch {
        // Keep raw name.
      }
      return COOKIE_PURGE_PREFIXES.some((prefix) => decoded.startsWith(prefix))
    })
    .map((name) => `${name}=; Path=/; Max-Age=0; SameSite=Lax`)
}

createServer({ maxHeaderSize: 1024 * 1024 }, (request, response) => {
  const filePath = resolvePath(request.url || '/')
  const cookiesToPurge = expiredCookies(request.headers.cookie || '')
  if (cookiesToPurge.length) response.setHeader('Set-Cookie', cookiesToPurge)
  response.setHeader('Content-Type', types[extname(filePath)] || 'application/octet-stream')
  response.setHeader('Cache-Control', filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable')
  createReadStream(filePath)
    .on('error', () => {
      response.statusCode = 500
      response.end('Server error')
    })
    .pipe(response)
}).listen(port, host, () => {
  console.log(`Static Fizzia server running at http://localhost:${port}/`)
  log(`listening http://localhost:${port}/`)
})

setInterval(() => {}, 60 * 60 * 1000)
