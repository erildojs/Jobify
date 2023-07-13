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
  const categoriasDb = await db.all('select * from categorias;')
  const vagas = await db.all('select * from vagas;')
  const categorias = categoriasDb.map(categoria => {
    return {
      ...categoria,
      vagas: vagas.filter(vaga => vaga.categoria_id === categoria.id)
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

app.get('/admin/vagas/delete/:id', async (request, response) => {
  const db = await openDb()
  await db.run('delete from vagas where id = ' + request.params.id + '')
  response.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async (request, response) => {
  //const db = await openDb()
  const db = await openDb()
  //await db.run('delete from vagas where id = ' + request.params.id + '')
  const categorias = await db.all('select * from categorias')
  response.render('admin/nova-vaga', {categorias})
})

app.post('/admin/vagas/nova', async (request, response) => {
  const {titulo, descricao, categoria_id} = request.body
  const db = await openDb()
  await db.exec(`insert into vagas(categoria_id, titulo, descricao) values("${categoria_id}", "${titulo}", "${descricao}")`)
  return response.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async (request, response) => {
  const db = await openDb()
  const categorias = await db.all('select * from categorias')
  const vaga = await db.get('select * from vagas where id = '+request.params.id)
  response.render('admin/editar-vaga', {categorias, vaga})
})

app.post('/admin/vagas/editar/:id', async (request, response) => {
  const {titulo, descricao, categoria_id} = request.body
  const {id} = request.params
  const db = await openDb()
  await db.run(`update vagas set categoria_id = ${categoria_id}, titulo = '${titulo}', descricao = '${descricao}' where id = ${id}`)
  response.redirect('/admin/vagas')
})

openDb().then(db => {
  db.exec('create table if not exists categorias (id INTEGER PRIMARY KEY, name TEXT);')
  db.exec('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria_id INTEGER, titulo TEXT, descricao TEXT);')
  //const category = 'Marketing Team'
  //const category = 'Remote Developer'
  //const vaga = 'Marketing Digital (San Francisco)'
  //const vaga = 'Fullstack Developer (Remote)'
  //const descricao = 'Vaga para marketing digital que fez o fullstack lab'
  //const descricao = 'Vaga para fullstack developer que fez o fullstack lab'
  //db.exec(`insert into categorias(name) values("${category}");`)
  //db.exec(`insert into vagas(categoria_id, titulo, descricao) values(2, "${vaga}", "${descricao}");`)
})

app.listen(port, ()=> {
    console.log('running....');
})