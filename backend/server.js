const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const PORT = process.env.PORT || 5000

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (_req, res) => {
  res.status(200).send('API running')
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on port ${PORT}`)
})


