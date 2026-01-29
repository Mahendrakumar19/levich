// Simple in-memory items store
const now = Date.now()
const minute = 60 * 1000

module.exports = [
  {
    id: 'item-1',
    title: 'Vintage Camera',
    startingPrice: 50,
    currentBid: 50,
    highestBidder: null,
    endTime: now + 10 * minute
  },
  {
    id: 'item-2',
    title: 'Signed Vinyl',
    startingPrice: 30,
    currentBid: 30,
    highestBidder: null,
    endTime: now + 12 * minute
  },
  {
    id: 'item-3',
    title: 'Antique Watch',
    startingPrice: 120,
    currentBid: 120,
    highestBidder: null,
    endTime: now + 13 * minute
  },
  {
    id: 'item-4',
    title: 'Collectible Card',
    startingPrice: 5,
    currentBid: 5,
    highestBidder: null,
    endTime: now + 15 * minute
  }
]
