const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { Mutex } = require('async-mutex')
const items = require('./items')

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://vercel.app', /\.vercel\.app$/] 
      : '*',
    credentials: true
  }
})

// mutexes per item to avoid race conditions
const mutexes = new Map()
function getMutex(itemId) {
  if (!mutexes.has(itemId)) mutexes.set(itemId, new Mutex())
  return mutexes.get(itemId)
}

app.get('/items', (req, res) => {
  // Return items and server time for client sync
  res.json({ items, serverTime: Date.now() })
})

io.on('connection', (socket) => {
  socket.on('BID_PLACED', async (data) => {
    const { itemId, amount, bidderId } = data || {}
    const item = items.find(i => i.id === itemId)
    if (!item) {
      socket.emit('BID_REJECTED', { itemId, reason: 'INVALID_ITEM' })
      return
    }

    const mutex = getMutex(itemId)
    await mutex.runExclusive(async () => {
      const now = Date.now()
      if (now >= item.endTime) {
        socket.emit('BID_REJECTED', { itemId, reason: 'AUCTION_ENDED' })
        return
      }

      if (amount <= item.currentBid) {
        // immediately reject lower-or-equal bids
        socket.emit('BID_REJECTED', { itemId, reason: 'OUTBID', currentBid: item.currentBid })
        return
      }

      // Accept bid
      item.currentBid = amount
      item.highestBidder = bidderId

      io.emit('UPDATE_BID', { itemId, amount, bidderId, endTime: item.endTime })
    })
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
