import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

function useClientId() {
  const [id] = useState(() => {
    let id = localStorage.getItem('clientId')
    if (!id) {
      id = 'bidder-' + Math.random().toString(36).slice(2, 9)
      localStorage.setItem('clientId', id)
    }
    return id
  })
  return id
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

function msToTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function App() {
  const [items, setItems] = useState([])
  const [offset, setOffset] = useState(0)
  const socketRef = useRef(null)
  const clientId = useClientId()
  const statusRef = useRef(new Map()) // itemId -> 'winning'|'outbid'|''

  useEffect(() => {
    let mounted = true
    axios.get(`${SERVER}/items`).then(res => {
      if (!mounted) return
      const { items: serverItems, serverTime } = res.data
      setOffset(serverTime - Date.now())
      const mapped = serverItems.map(it => ({
        ...it,
        flash: false,
        // local status initial
        status: it.highestBidder === clientId ? 'winning' : ''
      }))
      mapped.forEach(it => statusRef.current.set(it.id, it.status || ''))
      setItems(mapped)
    }).catch(() => {
      // silent for now
    })
    return () => { mounted = false }
  }, [clientId])

  useEffect(() => {
    const socket = io(SERVER, { autoConnect: true })
    socketRef.current = socket

    socket.on('UPDATE_BID', payload => {
      const { itemId, amount, bidderId } = payload
      setItems(prev => prev.map(it => {
        if (it.id !== itemId) return it
        // determine status
        const wasWinner = it.highestBidder === clientId
        const nowWinner = bidderId === clientId
        let status = ''
        if (nowWinner) status = 'winning'
        else if (wasWinner && !nowWinner) status = 'outbid'
        else status = ''

        statusRef.current.set(itemId, status)
        return { ...it, currentBid: amount, highestBidder: bidderId, flash: true, status }
      }))
      // clear flash quickly
      setTimeout(() => {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, flash: false } : i))
      }, 300)
    })

    socket.on('BID_REJECTED', ({ itemId, reason, currentBid }) => {
      if (!itemId) return
      if (reason === 'OUTBID') {
        // show outbid state
        setItems(prev => prev.map(it => it.id === itemId ? { ...it, currentBid: currentBid ?? it.currentBid, status: 'outbid' } : it))
        statusRef.current.set(itemId, 'outbid')
      } else if (reason === 'AUCTION_ENDED') {
        setItems(prev => prev.map(it => it.id === itemId ? { ...it, status: '' } : it))
        statusRef.current.set(itemId, '')
      }
    })

    socket.on('AUCTIONS_RESET', ({ items: resetItems, serverTime }) => {
      setOffset(serverTime - Date.now())
      const mapped = resetItems.map(it => ({
        ...it,
        flash: false,
        status: it.highestBidder === clientId ? 'winning' : ''
      }))
      mapped.forEach(it => statusRef.current.set(it.id, it.status || ''))
      setItems(mapped)
    })

    return () => socket.disconnect()
  }, [clientId])

  // tick to re-render countdowns
  useEffect(() => {
    const t = setInterval(() => setItems(s => s.map(x => ({ ...x }))), 500)
    return () => clearInterval(t)
  }, [])

  function serverNow() { return Date.now() + offset }

  function placeBid(item) {
    const msLeft = Math.max(0, item.endTime - serverNow())
    if (msLeft <= 0) return
    const newAmount = Number(item.currentBid) + 10
    // simple numeric safety
    if (!Number.isFinite(newAmount)) return
    socketRef.current.emit('BID_PLACED', { itemId: item.id, amount: newAmount, bidderId: clientId })
  }

  async function resetAuctions() {
    try {
      const res = await axios.post(`${SERVER}/reset`)
      // Socket will broadcast reset to all clients
    } catch (err) {
      console.error('Reset failed:', err)
    }
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Live Auction</h1>
          <div className="subtitle">Real-time final-seconds bidding</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="reset" onClick={resetAuctions}>Reset Auctions</button>
          <div className="me">You: <strong>{clientId}</strong></div>
        </div>
      </header>

      <main>
        <div className="grid">
          {items.map(item => {
            const msLeft = Math.max(0, item.endTime - serverNow())
            const timeText = msToTime(msLeft)
            const isWinning = (item.highestBidder === clientId)
            const isOutbid = (item.status === 'outbid')
            return (
              <article key={item.id} className={`card ${item.flash ? 'flash' : ''} ${isOutbid ? 'outbid' : ''}`}>
                <div className="card-head">
                  <h3>{item.title}</h3>
                  <div className={`badge ${isWinning ? 'winning' : isOutbid ? 'red' : ''}`}>
                    {isWinning ? 'Winning' : isOutbid ? 'Outbid' : 'Live'}
                  </div>
                </div>

                <div className="price-row">
                  <div className="price">{usd.format(item.currentBid)}</div>
                  <div className="increment">+$10</div>
                </div>

                <div className="meta">
                  <div className="countdown">{timeText}</div>
                  <div className="ends">Ends: {new Date(item.endTime).toLocaleString('en-IN')}</div>
                </div>

                <div className="actions">
                  <button className="bid" onClick={() => placeBid(item)} disabled={msLeft === 0}>
                    Bid +$10
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}
