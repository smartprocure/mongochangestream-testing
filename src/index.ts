import { faker } from '@faker-js/faker'
import {
  type AnyBulkWriteOperation,
  type Collection,
  type Db,
  type Document,
} from 'mongodb'
import ms from 'ms'
import assert from 'node:assert'
import { TimeoutError, WaitOptions, waitUntil } from 'prom-utils'

/**
 * Asserts that the provided predicate eventually returns true.
 *
 * @param pred - The predicate to check: an async function returning a boolean.
 * @param failureMessage - The message to display if the predicate does not
 * return true before the timeout.
 * @param [waitOptions] - Options to override the default options passed into
 * `waitUntil`.
 *
 * @throws AssertionError if the predicate does not return true before the
 * timeout.
 */
export const assertEventually = async (
  pred: () => Promise<boolean>,
  failureMessage = 'Failed to satisfy predicate',
  waitOptions: WaitOptions = {}
) => {
  try {
    await waitUntil(pred, {
      timeout: ms('60s'),
      checkFrequency: ms('50ms'),
      ...waitOptions,
    })
  } catch (e) {
    if (e instanceof TimeoutError) {
      assert.fail(failureMessage)
    } else {
      throw e
    }
  }
}

export const schema: Document = {
  bsonType: 'object',
  additionalProperties: false,
  required: ['name'],
  properties: {
    _id: { bsonType: 'objectId' },
    name: { bsonType: 'string' },
    likes: {
      bsonType: 'array',
      items: {
        bsonType: 'string',
      },
    },
    address: {
      bsonType: 'object',
      properties: {
        city: { bsonType: 'string' },
        state: { bsonType: 'string' },
        zipCode: { bsonType: 'string' },
        geo: {
          bsonType: 'object',
          properties: {
            lat: {
              bsonType: 'number',
            },
            long: {
              bsonType: 'number',
            },
          },
        },
      },
    },
    createdAt: { bsonType: 'date' },
  },
}

export const numDocs = 500

export const genUser = () => ({
  name: faker.person.fullName(),
  likes: [faker.animal.dog(), faker.animal.cat()],
  address: {
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    geo: {
      lat: faker.location.latitude(),
      long: faker.location.longitude(),
    },
  },
  createdAt: faker.date.past(),
})

export const populateCollection = (collection: Collection, count = numDocs) => {
  const users: AnyBulkWriteOperation[] = []
  for (let i = 0; i < count; i++) {
    users.push({ insertOne: { document: genUser() } })
  }
  return collection.bulkWrite(users)
}

type Resetable = { reset: () => Promise<void> }

/**
 * Drop the collection, if it exists, and initialize the JSON schema.
 */
export const initCollection = async (db: Db, coll: Collection) => {
  // Drop the collection
  await coll.drop()
  // Set schema
  await db.createCollection(coll.collectionName, {
    validator: { $jsonSchema: schema },
  })
}

/**
 * Initialize the sync state and database state.
 */
export const initState = async (
  sync: Resetable,
  db: Db,
  coll: Collection,
  numDocs?: number
) => {
  // Clear syncing state
  await sync.reset()
  // Init collection
  await initCollection(db, coll)
  // Populate data
  await populateCollection(coll, numDocs)
}
