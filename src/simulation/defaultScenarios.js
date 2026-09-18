// Sneplus Live — the only place default scenarios are defined.
// Shared by the simulator UI, the live viewer, and the automated tests (UMD).
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SneplusDefaults = api;
})(typeof self !== 'undefined' ? self : this, function () {

    // All times are absolute seconds from live start.
    // Sneakers follows the MVP brief timeline exactly:
    // 00:03 joins, 00:06 first comment, 00:08 product, 00:12 auction start,
    // bids $1/$2/$3/$5 at 15/20/27/32, countdown 35, final bid $7 at 38, end 41.
    const DEFAULT_SCENARIOS = [
        {
            name: 'Air Icon Runner',
            icon: 'SH',
            imageUrl: '',
            category: 'Sneakers',
            type: 'auction',
            start: 1,
            initialViewers: 1,
            startAfter: 8,
            auctionStartAfter: 4,
            bidDuration: 29,
            countdownAt: 35,
            joins: [
                { after: 3, action: 'joined', name: 'Ali', pfp_url: '' },
                { after: 5, action: 'joined', name: 'Sara', pfp_url: '' },
                { after: 15, action: 'joined', name: 'Mohammad', pfp_url: '' }
            ],
            viewerUpdates: [
                { after: 23, viewers: 18 },
                { after: 34, viewers: 31 }
            ],
            comments: [
                { after: 6, name: 'Sara', comment: 'These look clean.' },
                { after: 18, name: 'Rana', comment: 'Who has size 42?' },
                { after: 25, name: 'Omar', comment: 'Ship to Jordan?' },
                { after: 30, name: 'Lina', comment: 'Last bid is coming.' }
            ],
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
            icon: 'PH',
            imageUrl: '',
            category: 'Phones',
            type: 'auction',
            start: 1,
            initialViewers: 1,
            startAfter: 6,
            auctionStartAfter: 5,
            bidDuration: 42,
            countdownAt: null,
            joins: [
                { after: 4, action: 'joined', name: 'Namo', pfp_url: '' },
                { after: 12, action: 'joined', name: 'Sara', pfp_url: '' }
            ],
            viewerUpdates: [{ after: 30, viewers: 42 }],
            comments: [
                { after: 9, name: 'Sara', comment: 'Storage?' },
                { after: 25, name: 'Namo', comment: 'Sealed box?' }
            ],
            bids: [
                { after: 14, bid_amount: 1, bidder_username: 'Namo' },
                { after: 19, bid_amount: 10, bidder_username: 'Sara' },
                { after: 25, bid_amount: 25, bidder_username: 'Ali' },
                { after: 31, bid_amount: 50, bidder_username: 'Rana' },
                { after: 38, bid_amount: 75, bidder_username: 'Omar' },
                { after: 50, bid_amount: 120, bidder_username: 'Lina' }
            ]
        },
        {
            name: 'Chrono Steel Watch',
            icon: 'WA',
            imageUrl: '',
            category: 'Watches',
            type: 'auction',
            start: 10,
            initialViewers: 1,
            startAfter: 6,
            auctionStartAfter: 4,
            bidDuration: 34,
            countdownAt: null,
            joins: [{ after: 5, action: 'joined', name: 'Yousef', pfp_url: '' }],
            viewerUpdates: [{ after: 25, viewers: 22 }],
            comments: [{ after: 13, name: 'Dana', comment: 'Beautiful dial.' }],
            bids: [
                { after: 13, bid_amount: 10, bidder_username: 'Yousef' },
                { after: 18, bid_amount: 20, bidder_username: 'Dana' },
                { after: 24, bid_amount: 35, bidder_username: 'Rana' },
                { after: 31, bid_amount: 50, bidder_username: 'Khaled' },
                { after: 41, bid_amount: 85, bidder_username: 'Farah' }
            ]
        },
        {
            name: 'Signature Branded Bag',
            icon: 'BG',
            imageUrl: '',
            category: 'Fashion',
            type: 'auction',
            start: 5,
            initialViewers: 1,
            startAfter: 6,
            auctionStartAfter: 4,
            bidDuration: 34,
            countdownAt: null,
            joins: [{ after: 4, action: 'joined', name: 'Farah', pfp_url: '' }],
            viewerUpdates: [{ after: 28, viewers: 27 }],
            comments: [{ after: 16, name: 'Nour', comment: 'Show the inside please.' }],
            bids: [
                { after: 13, bid_amount: 5, bidder_username: 'Farah' },
                { after: 18, bid_amount: 10, bidder_username: 'Khaled' },
                { after: 24, bid_amount: 20, bidder_username: 'Nour' },
                { after: 31, bid_amount: 35, bidder_username: 'Dana' },
                { after: 41, bid_amount: 60, bidder_username: 'Rana' }
            ]
        },
        {
            name: 'Mystery Product',
            icon: 'MY',
            imageUrl: '',
            category: 'Other',
            type: 'auction',
            start: 1,
            initialViewers: 1,
            startAfter: 6,
            auctionStartAfter: 4,
            bidDuration: 34,
            countdownAt: null,
            joins: [{ after: 4, action: 'joined', name: 'Omar', pfp_url: '' }],
            viewerUpdates: [{ after: 29, viewers: 35 }],
            comments: [{ after: 15, name: 'Ali', comment: 'Open it!' }],
            bids: [
                { after: 13, bid_amount: 1, bidder_username: 'Omar' },
                { after: 18, bid_amount: 5, bidder_username: 'Ali' },
                { after: 25, bid_amount: 10, bidder_username: 'Mohammad' },
                { after: 32, bid_amount: 20, bidder_username: 'Sara' },
                { after: 41, bid_amount: 35, bidder_username: 'Lina' }
            ]
        }
    ];

    return { DEFAULT_SCENARIOS };
});

