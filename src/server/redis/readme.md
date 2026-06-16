# Redis Schema

Reference for the data stored in Redis. Use `keys.ts` to build these key
strings in code rather than hand-typing them.

All hash field values are strings (Redis hash fields are always strings).
JSON-encode/decode arrays or objects (e.g. `genres`) at the application layer.

**daily job is the primary writer of this schema** — it auto-discovers
any show airing in the next 24h (via AniList's `airingSchedules` query) and
seeds `show:*`/`streams:*`/`schedule:*` on first sight, including
non-seasonal/long-running shows (Detective Conan, One Piece, etc.). 
(seasonal, optional) additionally enriches `show:{anilistId}` with full
metadata for the seasonal megathread.

---

## `show:{anilistId}` — Hash

Title and metadata for one show-season 

| Field | Type | Notes |
|---|---|---|
| `anilistId` | string (int) | also the key suffix |
| `malId` | string (int) | from AniList `idMal` — kept for Jikan lookups (MAL score fetched on demand, not stored) |
| `titleRomaji` | string | |
| `titleEnglish` | string | |
| `episodeCount` | string (int) | total episodes; used for finale detection (`episodeNumber === episodeCount`) |
| `genres` | string | JSON-encoded array, e.g. `["Action","Adventure"]` |
| `studio` | string | |
| `season` | string | `WINTER` / `SPRING` / `SUMMER` / `FALL` |
| `seasonYear` | string (int) | |
| `isEnabled` | string | `"1"` / `"0"` — mod can disable via menu action |
| `isSeasonal` | string | `"1"` / `"0"` — drives title format. **Not provided by AniList** (no season-number field exists); defaults to `"0"` on seed, set manually by a mod via menu action for new seasonal shows |
| `seasonNumber` | string (int) | e.g. `"2"` for "Season 2"; omit/blank if not seasonal |

```
HSET show:21 titleRomaji "One Piece" titleEnglish "One Piece" episodeCount "1140" genres "[\"Action\",\"Adventure\"]" studio "Toei Animation" season "SUMMER" seasonYear "2026" isEnabled "1" isSeasonal "0"

HGET show:21 titleRomaji
```

---

## `streams:{anilistId}` — Hash

One field per streaming platform; field name = platform name, value = the
show's **main page URL** on that platform (not per-episode links).

| Field | Value |
|---|---|
| `Crunchyroll` | show-page URL |
| `Netflix` | show-page URL |
| `Prime Video` | show-page URL |
| `Hindi Dub` | YouTube channel/playlist URL — **only present for show-seasons with a Muse India dub** 


## `schedule:{anilistId}:{episodeNumber}` — Hash

Airing/posting state for one episode.

| Field | Type | Notes |
|---|---|---|
| `airingAt` | string (int) | Unix timestamp UTC |
| `posted` | string | `"0"` / `"1"` |
| `postId` | string | Reddit post ID, set after posting |
| `postUrl` | string | full Reddit URL, set after posting |
| `retryCount` | string (int) | `"0"`–`"3"` |
| `postedAt` | string (int) | Unix timestamp, set after posting |

```
HSET schedule:21:1134 airingAt "1749999999" posted "0" retryCount "0"
HGET schedule:21:1134 posted
HSET schedule:21:1134 posted "1" postId "abc123" postUrl "https://redd.it/abc123" postedAt "1750000300"
```

**Dedup:** `EXISTS schedule:{anilistId}:{episodeNumber}` before
writing — skip if it already exists.

**Cleanup (after successful post):** once `posted = "1"` and the entry has
been appended to `threads:{anilistId}`, this hash can be deleted —
`DEL schedule:{anilistId}:{episodeNumber}` and
`SREM season:current:schedule "{anilistId}:{episodeNumber}"`.

---

## `season:current:schedule` — Set

Members: `"{anilistId}:{episodeNumber}"` strings — the index
to find episodes to check, avoiding a full key scan.

```
SADD season:current:schedule "21:1134" "5114:64"
SMEMBERS season:current:schedule
SREM season:current:schedule "21:1134"   -- once posted (see above)
```

---

## `season:current:shows` — Set

Members: `anilistId` strings — all currently-tracked shows. Populated
incrementally daily discovery. Used for the season-rollover prune step (only
removes shows whose season has actually concluded).

```
SADD season:current:shows "21" "5114"
SMEMBERS season:current:shows
SREM season:current:shows "21"   -- at season rollover, only if concluded
```

---

## `threads:{anilistId}` — List

Permanent history of posted episode discussion threads for a show-season —
used to build the "previous episode discussions" table in post bodies and
the wiki. **Never deleted/pruned**.

Each element is a small JSON string: `{episode, url, postedAt}`.

```
RPUSH threads:21 '{"episode":1133,"url":"https://redd.it/def","postedAt":1749900000}'
LRANGE threads:21 0 -1
```

---

## Lifecycle / Pruning (Season Rollover)

After the season wrap-up thread is posted and the wiki is updated, **for
shows whose season has concluded** (no remaining `schedule:{anilistId}:*`
entries, finale posted):

```
For each anilistId in season:current:shows (SMEMBERS):
  → If show's season has concluded:
      → HDEL show:{anilistId} <all fields except titleRomaji, titleEnglish>
        (kept just enough to label entries in threads:{anilistId} / wiki history)
      → DEL streams:{anilistId}
      → SREM season:current:shows {anilistId}
  → Else (ongoing/long-running shows, e.g. Detective Conan, One Piece):
      → leave as-is — Job 2 continues refreshing daily

season:current:shows / season:current:schedule continue to be maintained
incrementally by Job 2 (and optionally enriched by Job 1's seasonal catalog
seed for the new season).
```

This keeps Redis as an operational cache for actively-tracked shows, not a
permanent mirror of AniList data (see AniList Terms of Use — no
backup/storage use, no hoarding).

---
