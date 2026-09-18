const DEFAULT_SCENARIOS = [
    {
        name: 'Air Icon Runner',
        category: 'Sneakers',
        type: 'auction',
        start: 1,
        initialViewers: 1,
        startAfter: 8,
        auctionStartAfter: 4,
        bidDuration: 29,
        countdownAt: 35,
        bids: [
            { after: 15, bid_amount: 1, bidder_username: 'Ali' },
            { after: 20, bid_amount: 2, bidder_username: 'Mohammad' },
            { after: 27, bid_amount: 3, bidder_username: 'Sara' },
            { after: 32, bid_amount: 5, bidder_username: 'Omar' },
            { after: 38, bid_amount: 7, bidder_username: 'Lina' }
        ]
    },
    {
        name: 'iPhone Pro Drop',
        category: 'Phones',
        type: 'auction',
        start: 1,
        initialViewers: 1,
        startAfter: 6,
        auctionStartAfter: 5,
        bidDuration: 42,
        bids: [1, 10, 25, 50, 75, 120].map((amount, index) => ({
            after: [14, 19, 25, 31, 38, 50][index],
            bid_amount: amount,
            bidder_username: ['Namo', 'Sara', 'Ali', 'Rana', 'Omar', 'Lina'][index]
        }))
    },
    {
        name: 'Chrono Steel Watch',
        category: 'Watches',
        type: 'auction',
        start: 10,
        initialViewers: 1,
        startAfter: 6,
        auctionStartAfter: 4,
        bidDuration: 34,
        bids: [10, 20, 35, 50, 85].map((amount, index) => ({
            after: [13, 18, 24, 31, 41][index],
            bid_amount: amount,
            bidder_username: ['Yousef', 'Dana', 'Rana', 'Khaled', 'Farah'][index]
        }))
    },
    {
        name: 'Signature Branded Bag',
        category: 'Fashion',
        type: 'auction',
        start: 5,
        initialViewers: 1,
        startAfter: 6,
        auctionStartAfter: 4,
        bidDuration: 34,
        bids: [5, 10, 20, 35, 60].map((amount, index) => ({
            after: [13, 18, 24, 31, 41][index],
            bid_amount: amount,
            bidder_username: ['Farah', 'Khaled', 'Nour', 'Dana', 'Rana'][index]
        }))
    },
    {
        name: 'Mystery Product',
        category: 'Other',
        type: 'auction',
        start: 1,
        initialViewers: 1,
        startAfter: 6,
        auctionStartAfter: 4,
        bidDuration: 34,
        bids: [1, 5, 10, 20, 35].map((amount, index) => ({
            after: [13, 18, 25, 32, 41][index],
            bid_amount: amount,
            bidder_username: ['Omar', 'Ali', 'Mohammad', 'Sara', 'Lina'][index]
        }))
    }
];

module.exports = { DEFAULT_SCENARIOS };
