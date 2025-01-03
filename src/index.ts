import { faker } from '@faker-js/faker'
import {
  type Document,
  type Collection,
  type Db,
  type AnyBulkWriteOperation,
} from 'mongodb'

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
 * Initialize the sync state and database state.
 */
export const initState = async (sync: Resetable, db: Db, coll: Collection) => {
  // Clear syncing state
  await sync.reset()
  // Delete all documents
  await coll.deleteMany({})
  // Set schema
  await db.command({
    collMod: coll.collectionName,
    validator: { $jsonSchema: schema },
  })
  // Populate data
  await populateCollection(coll)
}
