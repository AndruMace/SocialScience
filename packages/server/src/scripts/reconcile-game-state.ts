/**
 * One-time (or repair) job: rebuild activity_xp / follower_stature_xp / xp / level from xp_events + latest snapshot.
 * Run after adding follower stature columns: `bun run reconcile-game-state` from packages/server (DATABASE_URL required).
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { gameService } from '../services/game.service.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../../../../.env') })

async function main() {
  console.log('Reconciling all game_state rows...')
  await gameService.reconcileAllGameStates()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
