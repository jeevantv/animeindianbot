/**
 * Redis key helpers
 * Centralizes all key string construction so patterns stay consistent
 * across jobs/services. See README.md in this directory for the full
 * schema (hash fields, sets, lists) and lifecycle/pruning rules.
 */

type Id = number | string;

/** Hash: show:{anilistId} — title/metadata for a show-season */
export const showKey = (anilistId: Id): string => `show:${anilistId}`;

/** Hash: streams:{anilistId} — platform name -> show-page URL */
export const streamsKey = (anilistId: Id): string => `streams:${anilistId}`;

/** Hash: schedule:{anilistId}:{episodeNumber} — airing/post state for one episode */
export const scheduleKey = (anilistId: Id, episodeNumber: Id): string =>
    `schedule:${anilistId}:${episodeNumber}`;

/** List: threads:{anilistId} — JSON entries of posted episode discussion threads */
export const threadsKey = (anilistId: Id): string => `threads:${anilistId}`;

/** Set: anilistIds of shows tracked for the active season */
export const SEASON_CURRENT_SHOWS = 'season:current:shows';

/** Set: "{anilistId}:{episodeNumber}" members — unposted episodes */
export const SEASON_CURRENT_SCHEDULE = 'season:current:schedule';

/** Builds a member string for the season:current:schedule set */
export const scheduleMember = (anilistId: Id, episodeNumber: Id): string =>
    `${anilistId}:${episodeNumber}`;

/** Splits a season:current:schedule member back into its parts */
export const parseScheduleMember = (
    member: string
): { anilistId: string; episodeNumber: string } => {
    const [anilistId, episodeNumber] = member.split(':');
    if (!anilistId || !episodeNumber) {
        throw new Error(`Invalid schedule member format: "${member}"`);
    }
    return { anilistId, episodeNumber };
};