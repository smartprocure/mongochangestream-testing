import ms from 'ms'
import { describe, expect, test } from 'vitest'

import { assertEventually } from './index.js'

const alwaysTrue = async () => true
const alwaysFalse = async () => false

const eventuallyTrue = (delay: number) => {
  let currentValue = false

  setTimeout(() => {
    currentValue = true
  }, delay)

  return async () => currentValue
}

describe('assertEventually', () => {
  test('should NOT throw an error if the condition is immediately met', async () => {
    await assertEventually(alwaysTrue, 'Condition not met')
  })
  test('should NOT throw an error if the condition is met before the default timeout', async () => {
    const checkIfTrue = eventuallyTrue(ms('1s'))
    await assertEventually(
      checkIfTrue,
      'Condition not met before default timeout'
    )
  })
  test('should NOT throw an error if the condition is met before the specified timeout', async () => {
    const checkIfTrue = eventuallyTrue(ms('1s'))
    await assertEventually(
      checkIfTrue,
      'Condition not met before custom timeout',
      {
        timeout: ms('5s'),
      }
    )
  })
  test('should throw an error if the condition is never met', async () => {
    await expect(() =>
      assertEventually(alwaysFalse, 'Condition not met', {
        timeout: ms('1s'),
      })
    ).rejects.toThrow('Condition not met')
  })
  test('should throw an error if the condition is not met before the timeout', async () => {
    const checkIfTrue = eventuallyTrue(ms('5s'))
    await expect(() =>
      assertEventually(checkIfTrue, 'Condition not met before timeout', {
        timeout: ms('1s'),
      })
    ).rejects.toThrow('Condition not met before timeout')
  })
})
