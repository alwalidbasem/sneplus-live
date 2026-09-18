const test = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_SCENARIOS } = require('../src/simulation/defaultScenarios');
const { buildEvents, TimelineRunner } = require('../src/simulation/timeline');

test('all five scenarios keep required starting prices and bid sequences', () => {
    const expected = [
        ['Sneakers', 1, [1, 2, 3, 5, 7]],
        ['Phones', 1, [1, 10, 25, 50, 75, 120]],
        ['Watches', 10, [10, 20, 35, 50, 85]],
        ['Fashion', 5, [5, 10, 20, 35, 60]],
        ['Other', 1, [1, 5, 10, 20, 35]]
    ];

    assert.equal(DEFAULT_SCENARIOS.length, 5);
    expected.forEach(([category, start, bids], index) => {
        const scenario = DEFAULT_SCENARIOS[index];
        assert.equal(scenario.category, category);
        assert.equal(scenario.start, start);
        assert.deepEqual(scenario.bids.map((bid) => bid.bid_amount), bids);
    });
});

test('sneakers scenario matches the brief timeline for core auction events', () => {
    const events = buildEvents(DEFAULT_SCENARIOS[0]);
    const compact = events
        .filter((event) => ['PRODUCT_START', 'AUCTION_START', 'BID', 'COUNTDOWN', 'AUCTION_END'].includes(event.type))
        .map((event) => [event.t, event.type, event.amount || event.value || null]);

    assert.deepEqual(compact, [
        [8, 'PRODUCT_START', null],
        [12, 'AUCTION_START', 1],
        [15, 'BID', 1],
        [20, 'BID', 2],
        [27, 'BID', 3],
        [32, 'BID', 5],
        [35, 'COUNTDOWN', 3],
        [36, 'COUNTDOWN', 2],
        [37, 'COUNTDOWN', 1],
        [38, 'BID', 7],
        [41, 'AUCTION_END', null]
    ]);
});

test('timeline runner executes reached events once, even after delayed ticks', () => {
    const runner = new TimelineRunner(buildEvents(DEFAULT_SCENARIOS[0]));
    const first = runner.advanceTo(20);
    const second = runner.advanceTo(20);
    const late = runner.advanceTo(99);

    assert.equal(first.filter((event) => event.type === 'BID').length, 2);
    assert.equal(second.length, 0);
    assert.equal(late.at(-1).type, 'AUCTION_END');
    assert.equal(runner.executed.filter((event) => event.type === 'AUCTION_END').length, 1);
});

test('pause freezes execution, resume continues, restart resets state', () => {
    const runner = new TimelineRunner(buildEvents(DEFAULT_SCENARIOS[0]));
    runner.advanceTo(12);
    runner.pause();
    assert.deepEqual(runner.advanceTo(99), []);
    runner.resume();
    assert.equal(runner.advanceTo(15).at(-1).type, 'BID');
    runner.restart();
    assert.equal(runner.fired, 0);
    assert.deepEqual(runner.executed, []);
});
