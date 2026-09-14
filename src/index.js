import 'dotenv/config'
import { createMcpExpressApp } from '@modelcontextprotocol/express'
import { toNodeHandler } from '@modelcontextprotocol/node'
import { createMcpHandler } from '@modelcontextprotocol/server'
import mongoose from 'mongoose'
import {config} from './config.js'
import {connectDatabase} from './db.js'
import {createScholarshipServer} from './mcp/server.js'

const mcpHandler = createMcpHandler(() => createScholarshipServer())
const nodeHandler = toNodeHandler(mcpHandler)

const app = createMcpExpressApp({
  host: config.host,
  allowedHosts: ["127.0.0.1", "localhost"],
});

app.get('/health', (_req,res) => {
  res.json({
    status: 'ok',
    service: 'scholarship-research-mcp',
    transport: 'streammable-http'
  })
})

app.all('/mcp', (req, res) => {
  void nodeHandler(req, res, req.body);
})

let httpServer;

function shutdown(signal, code = 0) {
  console.log(`Received ${signal}, shutting down gracefully...`)
  const forceTimer = setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 5_000)
  forceTimer.unref()

  const closeHttp = httpServer
    ? new Promise((resolve) => httpServer.close(resolve))
    : Promise.resolve()

  void Promise.allSettled([closeHttp, mcpHandler.close(), mongoose.disconnect()]).then(() => {
    clearTimeout(forceTimer)
    process.exit(code)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

async function start() {
  await connectDatabase()
  httpServer = app.listen(config.port, config.host, () => {
    console.log(`Scholarship research MCP server listening on http://${config.host}:${config.port}/mcp`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})