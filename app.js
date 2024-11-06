const express = require('express')
const app = express()
app.use(express.json())

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')

const connection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running...')
    })
  } catch (e) {
    console.log(`Error is ${e.message}`)
    process.exit(1)
  }
}

connection()

const hasPriorityandStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasCateogryandPriorityProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  )
}

const hasCategoryandStatusProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasSearch_qProperty = requestQuery => {
  return requestQuery.search_q !== ''
}

const resultResponse = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let getQuery = ''
  let getQueryResponse = null
  const {search_q = '', category, priority, status} = request.query

  switch (true) {
    case hasPriorityandStatusProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getQuery = `
                        SELECT * FROM todo 
                        WHERE status ="${status}" 
                        AND priority = "${priority}";
                    `
          getQueryResponse = await db.all(getQuery)
          response.send(getQueryResponse.map(each => resultResponse(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getQuery = `
                    SELECT * FROM todo 
                    WHERE status = "${status}"
                `
        getQueryResponse = await db.all(getQuery)
        response.send(getQueryResponse.map(each => resultResponse(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getQuery = `
                    SELECT * FROM todo 
                    WHERE priority = "${priority}"
                `
        getQueryResponse = await db.all(getQuery)
        response.send(getQueryResponse.map(each => resultResponse(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        getQuery = `
                    SELECT * FROM todo 
                    WHERE category = "${category}"
                `
        getQueryResponse = await db.all(getQuery)
        response.send(getQueryResponse.map(each => resultResponse(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryandStatusProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getQuery = `
                        SELECT * FROM todo 
                        WHERE status ="${status}" 
                        AND category = "${category}";
                    `
          getQueryResponse = await db.all(getQuery)
          response.send(getQueryResponse.map(each => resultResponse(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCateogryandPriorityProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getQuery = `
                        SELECT * FROM todo 
                        WHERE priority ="${priority}" 
                        AND category = "${category}";
                    `
          getQueryResponse = await db.all(getQuery)
          response.send(getQueryResponse.map(each => resultResponse(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasSearch_qProperty(request.query):
      getQuery = `
                SELECT * FROM todo 
                WHERE todo LIKE "%${search_q}%";
            `
      getQueryResponse = await db.all(getQuery)
      response.send(getQueryResponse.map(each => resultResponse(each)))
      break
    default:
      getQuery = `
                SELECT * FROM todo
            `
      getQueryResponse = await db.all(getQuery)
      response.send(getQueryResponse.map(each => resultResponse(each)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const particularIdQuery = `
  SELECT * FROM todo WHERE id = ${todoId}
  `
  const particularIdQueryResponse = await db.get(particularIdQuery)
  response.send(resultResponse(particularIdQueryResponse))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query

  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')

    const dateQuery = `
      SELECT * FROM todo 
      WHERE due_date = "${newDate}";
    `

    const dateQueryResponse = await db.all(dateQuery)

    response.send(dateQueryResponse.map(eachItem => resultResponse(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  if (category === 'WORK' || category === 'LEARNING' || category === 'HOME') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newformatDate = format(new Date(dueDate), "yyyy-MM-dd")
          const createTodoQuery = `
                INSERT INTO todo(id, todo, priority, status, category, due_date)
                VALUES (${id},"${todo}", "${priority}", "${status}", "${category}", "${newformatDate}")
                `
          await db.run(createTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Category')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  let updateQuery = ''
  let queryResponse = null
  const {todoId} = request.params

  const {status, priority, todo, category, dueDate} = request.body

  if (status !== undefined) {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      updateQuery = `
          UPDATE todo SET status = "${status}" WHERE id = ${todoId}`

      queryResponse = await db.run(updateQuery)
      response.send('Status Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else if (category !== undefined) {
    if (category === 'WORK' || category === 'LEARNING' || category === 'HOME') {
      updateQuery = `
          UPDATE todo SET category = "${category}" WHERE id = ${todoId}`

      queryResponse = await db.run(updateQuery)
      response.send('Category Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  } else if (priority !== undefined) {
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      updateQuery = `
          UPDATE todo SET priority = "${priority}" WHERE id = ${todoId}`

      queryResponse = await db.run(updateQuery)
      response.send('Priority Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else if (dueDate !== undefined) {
    if (isMatch(dueDate, 'yyyy-MM-dd')) {
      const newDate = format(new Date(dueDate), 'yyyy-MMM-dd')

      updateQuery = `
          UPDATE todo SET due_date = "${dueDate}" WHERE id = ${todoId}`

      queryResponse = await db.run(updateQuery)
      response.send('Due Date Updated')
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    updateQuery = `
        UPDATE todo SET todo = "${todo}" WHERE id = ${todoId}`

    queryResponse = await db.run(updateQuery)
    response.send('Todo Updated')
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deletequery = `
    DELETE FROM todo 
    WHERE id = ${todoId} 
  `
  await db.run(deletequery)
  response.send('Todo Deleted')
})

module.exports = app
