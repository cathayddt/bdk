/* global describe, it, before, after, beforeEach, afterEach */
import assert from 'assert'
import { hello } from '../../src/service/hello'

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

  it('Hello unittest', function () {
    hello('Hello unittest')
    assert.strictEqual(true, true)
  })
})
