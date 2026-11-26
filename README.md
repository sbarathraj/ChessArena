# KnightArena — Production Cross-Platform Chess Platform

**KnightArena** is a high-performance, original-brand online chess platform designed for Android, iOS, and Web using **React Native**, **Expo SDK 52**, **TypeScript**, and **Supabase (PostgreSQL + Realtime)**.

---

## 1. Connected Supabase Project

- **Project ID**: `fraqqpkxpycerejkctyy`
- **Region**: `ap-northeast-1`
- **URL**: `https://fraqqpkxpycerejkctyy.supabase.co`
- **Database Status**: `ACTIVE_HEALTHY`
- **Applied Migrations**:
  - `public.profiles`: Public identities, display names, avatars, and presence status.
  - `public.private_user_settings`: User-scoped settings protected by Row-Level Security.
  - `public.games`: Authoritative match records with monotonic `state_version`, turn deadlines, and live clock balances.
  - `public.game_moves`: Persisted move ledger with `idempotency_key` and concurrency control.
  - `public.matchmaking_queue`: Atomic matchmaking pool with rating window filters.
  - `public.puzzles` & `public.puzzle_attempts`: Seeded tactical training sets.
  - Stored Procedures: `submit_move()`, `claim_timeout()`, `resign_game()`.

---

## 2. Key Architecture & Features

### Authoritative Move & Clock Engine
- Moves are submitted to PostgreSQL via `submit_move(p_game_id, p_san, p_uci, p_fen_after, p_idempotency_key)`.
- Clocks are updated atomically with turn intervals on the server without hammering the database every second.
- The client ticks smooth 100ms interpolated countdowns and auto-syncs with server timestamps.

### Storage Adaptability
- **Native**: `expo-secure-store` encrypts authentication sessions in the system keychain/keystore.
- **Web**: LocalStorage fallback avoids unsupported native modules on web browsers.

### Fair-Play & Offline Play
- Built-in **KnightEngine** offers 5-level offline computer play with zero network dependence.
- Automated tests verify FIDE rules: standard legal moves, Scholar's mate, stalemate, insufficient material, and Glicko-2 ratings.

---

## 3. Running the Project

### Running in Development:
```bash
# Start Web browser preview
npm run web

# Start Android development
npm run android

# Start iOS development
npm run ios
```

### Running Automated Test Suite:
```bash
npx jest
```
All 7 unit and integration tests pass successfully.
