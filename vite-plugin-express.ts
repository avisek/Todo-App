import { createServer } from 'vite'
import type { Connect, PluginOption, ViteDevServer } from 'vite'

function expressMiddleware(
  server: ViteDevServer,
  path: string,
): Connect.NextHandleFunction {
  return async function expressMiddleware(req, res, next) {
    process.env['VITE'] = 'true'
    try {
      const { app } = await server.ssrLoadModule(path)
      app(req, res, next)
    } catch (err) {
      console.error(err)
    }
  }
}

export default function express(path: string): PluginOption {
  return {
    name: 'vite3-plugin-express',
    configureServer: async (server) => {
      server.middlewares.use(expressMiddleware(server, path))
    },
    configurePreviewServer: async (server) => {
      const devServer = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
      })
      server.middlewares.use(expressMiddleware(devServer, path))
    },
  }
}
