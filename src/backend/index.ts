import express from 'express' 
import { join } from 'node:path/posix'
import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'
import { createPostgresDataProvider } from 'remult/postgres'

export const app = express()

const api = express.Router()
app.use(join(import.meta?.env?.BASE_URL ?? '/', '/api'), api)

//#region auth
import session from 'cookie-session'
import type { UserInfo } from 'remult'

api.use(session({ secret: process.env['SESSION_SECRET'] || 'my secret' }))

export const validUsers: UserInfo[] = [
  { id: '1', name: 'Jane', roles: ['admin'] },
  { id: '2', name: 'Steve' },
]
api.post('/signIn', express.json({ type: 'text' }), (req, res) => {
  const user = validUsers.find((user) => user.name === req.body.username)
  if (user) {
    req.session!['user'] = user
    res.json(user)
  } else {
    res.status(404).json("Invalid user, try 'Steve' or 'Jane'")
  }
})

api.post('/signOut', (req, res) => {
  req.session!['user'] = null
  res.json('signed out')
})

api.get('/currentUser', (req, res) => {
  res.json(req.session!['user'])
})
//#endregion

api.get('/hi', (_, res) => res.send('hello'))

const entities = [Task]

const remultApi = remultExpress({
  rootPath: '',
  entities,
  controllers: [TasksController],
  dataProvider: createPostgresDataProvider({
    connectionString:
      process.env['DATABASE_URL'] ||
      'postgresql://postgres:e2CdC3E16CdbD3bbCGebd-g3e-bCCbAG@roundhouse.proxy.rlwy.net:46870/railway' ||
      'postgres://postgres:MASTERKEY@localhost/postgres',
  }),
  getUser: (req) => req.session?.['user'],
})
api.use(remultApi)

import swaggerUi from 'swagger-ui-express'

const openApiDocument = remultApi.openApiDoc({ title: 'remult-react-todo' })
api.get('/openApi.json', (_, res) => res.json(openApiDocument))
api.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))

import { remultGraphql } from 'remult/graphql'
import { createYoga, createSchema } from 'graphql-yoga'

const { typeDefs, resolvers } = remultGraphql({
  entities: [Task],
})
const yoga = createYoga({
  graphqlEndpoint: '/graphql',
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
})
api.use(yoga.graphqlEndpoint, remultApi.withRemult, yoga)

if (!process.env['VITE']) {
  const frontendFiles = process.cwd() + '/dist'
  app.use(express.static(frontendFiles))
  app.get('/*', (_, res) => {
    res.sendFile(frontendFiles + '/index.html')
  })
  app.listen(process.env['PORT'] ?? 3002, () => console.log('Server started'))
}
