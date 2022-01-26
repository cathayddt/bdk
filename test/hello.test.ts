/* global describe, it, before, after, beforeEach, afterEach */
import assert from 'assert'

describe('hooks', function () {
  // this.slow(300000); // five minutes
  // this.timeout(10000);

  before(function () {
    // runs once before the first test in this block
  })

  after(function () {
    // runs once after the last test in this block
  })

  beforeEach(function () {
    // runs before each test in this block
  })

  afterEach(function () {
    // runs after each test in this block
  })

  it('node good', function () {
    assert.strictEqual(1, 1)
  })

  it('node', function () {
    assert.notStrictEqual(1, 2)
  })

  it('retries', function () {
    this.retries(10)

    assert.strictEqual(1, 1)
  })
})
