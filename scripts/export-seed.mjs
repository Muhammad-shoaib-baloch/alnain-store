// Exports the frontend seed database to api/seed.json so the PHP installer
// can populate MySQL with exactly the same catalogue/data shapes.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildSeed } from '../src/data/seed.js'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'api', 'seed.json')
mkdirSync(dirname(out), { recursive: true })

const db = buildSeed()
writeFileSync(out, JSON.stringify(db, null, 1))
console.log(`Wrote ${out}`)
console.log(`products=${db.products.length} categories=${db.categories.length} users=${db.users.length} orders=${db.orders.length}`)
