import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import {openDb} from './dbConfig'
import bodyParser from 'body-parser'
import path from 'path'

const app = express()
app.use(bodyParser.urlencoded({extended: true}))

app.set('views', path.join(__dirname, '..', 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '..', 'public')))

const port = process.env.PORT ? Number(process.env.PORT) : 3333

app.get('/', async (request, response) => {
  const db = await openDb()
  const categoriasDb = await db.all('select * from categorias')
  const vagas = await db.all('select * from vagas')
  const categorias = categoriasDb.map(categoria => {
    return {
      ...categoria,
      vagas: vagas.filter(vaga => vaga.categoria === categoria.id)
    }
  })
  response.render('home', {
    categorias
  })
})

app.get('/vaga/:id',async (request, response) => {
  const db = await openDb()
  const vaga = await db.get('select * from vagas where id = '+ request.params.id)
  response.render('vaga', {
    vaga
  })
})

app.get('/admin', (request, response) => {
  response.render('admin/home')
})

app.get('/admin/vagas', async (request, response) => {
  const db = await openDb()
  const vagas = await db.all('select * from vagas;')
  response.render('admin/vagas', {
    vagas
  })
})

app.get('/admin/categorias', async (request, response) => {
  const database = await openDb()
  const categorias = await database.all('select * from categorias')
  response.render('admin/categorias', {
    categorias
  })
})

app.get('/admin/vagas/delete/:id', async (request, response) => {
  const db = await openDb()
  await db.run('delete from vagas where id = ' + request.params.id + '')
  response.redirect('/admin/vagas')
})

app.get('/admin/categorias/delete/:id', async (request, response) => {
  const database = await openDb()
  await database.run('delete from categorias where id = ' + request.params.id + '')
  response.redirect('/admin/categorias')
})

app.get('/admin/vagas/nova', async (request, response) => {
  const db = await openDb()
  const categorias = await db.all('select * from categorias')
  response.render('admin/nova-vaga', {categorias})
})

app.get('/admin/categorias/nova', async (request, response) => {
  response.render('admin/nova-categoria')
})

app.post('/admin/vagas/nova', async (request, response) => {
  const {titulo, descricao, categoria} = request.body
  const db = await openDb()
  await db.exec(`insert into vagas(categoria, titulo, descricao) values(${categoria}, "${titulo}", "${descricao}")`)
  return response.redirect('/admin/vagas')
})

app.post('/admin/categorias/nova', async (request, response) => {
  const database = await openDb()
  const {name} = request.body
  await database.exec(`insert into categorias(name) values('${name}')`)
  response.redirect('/admin/categorias')
})

app.get('/admin/vagas/editar/:id', async (request, response) => {
  const db = await openDb()
  const categorias = await db.all('select * from categorias')
  const vaga = await db.get('select * from vagas where id = ' + request.params.id)
  response.render('admin/editar-vaga', {categorias, vaga})
})

app.get('/admin/categorias/editar/:id', async (request, response) => {
  const database = await openDb()
  const categoria = await database.get('select * from categorias where id = ' + request.params.id)
  response.render('admin/editar-categoria', {categoria})
})

app.post('/admin/vagas/editar/:id', async (request, response) => {
  const {titulo, descricao, categoria} = request.body
  const {id} = request.params
  const db = await openDb()
  await db.run(`update vagas set categoria = ${categoria}, titulo = '${titulo}', descricao = '${descricao}' where id = ${id}`)
  response.redirect('/admin/vagas')
})

app.post('/admin/categorias/editar/:id', async (request, response) => {
  const {name} = request.body
  const database = await openDb()
  await database.run(`update categorias set name = '${name}' where id = ${request.params.id}`)
  response.redirect('/admin/categorias')
})

openDb().then(db => {
  db.exec('create table if not exists categorias (id INTEGER PRIMARY KEY, name TEXT);')
  db.exec('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')
})

app.listen(port, ()=> {
    console.log('running....');
})