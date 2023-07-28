const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const db = require('mongoose')

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})
app.set('json spaces', 2)

db.connect(process.env.MONGO_URI)
db.connection.once('open', () => {
  console.log("Successfully connected to DB")
})
db.connection.on('error', console.error.bind(console, 'connection error:'))
const userSchema = new db.Schema({
  username: String
}, { versionKey: false })
const User = db.model("User", userSchema)
const exerciseSchema = new db.Schema({
  username: String,
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: Date,
  userId: String
})
const Exercise = db.model("Exercise", exerciseSchema)

// app.get('/api/deleteusers', async (req, res) => {
//   await Exercise.deleteMany({})
//   await User.deleteMany({})
//   res.send('deleted')
// })

app.post('/api/users', async (req, res) => {
  const username = req.body.username
  const foundUser = await User.findOne({ username })
  if (foundUser) { res.json(foundUser) } else {
    const newUser = await User.create({ username })
    res.json(newUser)
  }
})

app.get('/api/users', async (req, res) => {
  const users = await User.find()
  res.send(users)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  let { description, duration, date } = req.body
  const userId = req.params._id
  const userObject = await User.findById(userId)
  let username
  if (!userObject) { res.json({ message: "No user goes by that id" }); return } else { ({ username } = userObject) }
  if (!date) { date = new Date() } else { date = new Date(date) }
  await Exercise.create({
    username,
    description,
    duration,
    date,
    userId
  })
  res.send({
    username,
    description,
    duration: parseInt(duration),
    date: date.toDateString(),
    _id: userId
  })
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params
  let { from, to, limit } = req.query
  const filter = { userId: _id }
  const dateFilter = {}
  if (from) { dateFilter['$gte'] = new Date(from) }
  if (to) { dateFilter['$lte'] = new Date(to) }
  if (from || to) { filter.date = dateFilter }
  if (!limit) { limit = 1000 }
  const userObject = await User.findById(_id)
  let username
  if (!userObject) { res.json({ message: "No user goes by that id" }); return } else { ({ username } = userObject) }
  const exercises = await Exercise.find(filter).limit(limit)
  const log = exercises.map(e => {
    return {
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }
  })
  res.send({
    username,
    count: exercises.length,
    _id,
    log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
