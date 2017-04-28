const express = require('express')
const multer = require('multer')

// const PLAYER_UUID = process.env.PLAYER_UUID
// if (!PLAYER_UUID) throw new Error('No player uuid specified.')

const PLAY = 'media.play'
const PAUSE = 'media.pause'
const RESUME = 'media.resume'
const STOP = 'media.stop'

const upload = multer()

const app = express()

app.post('/', upload.single('thumb'), function(req, res, next) {
  const { Player, event } = JSON.parse(req.body.payload)

  // if (Player.uuid === PLAYER_UUID) {
  if (event === PLAY) console.log('play')
  if (event === PAUSE) console.log('pause')
  if (event === RESUME) console.log('resume')
  if (event === STOP) console.log('stop')
  // }

  res.sendStatus(200)
})

app.listen(process.env.PORT || 8000)
