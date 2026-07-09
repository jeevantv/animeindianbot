const API_URL = 'https://graphql.anilist.co';

export interface AiringSchedule {
  id: number;
  episode: number;
  airingAt: number;
  mediaId: number;
  media: {
    id: number;
    format: string;
    popularity: number;
    countryOfOrigin: string;
    title: {
      romaji: string | null;
      english: string | null;
    };
  };
}

export interface EpisodeSchedule {
  id: number;
  episodes: number | null;
  title: {
    romaji: string | null;
    english: string | null;
  };
  externalLinks: Array<{
    url: string | null;
    site: string | null;
    type: string | null;
    language: string | null;
    isDisabled: boolean | null;
  }>
}
const DAILY_SCHEDULE_QUERY = `
  query ($from: Int, $to: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo {
        hasNextPage
        currentPage
      }
      airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
        id
        episode
        airingAt
        mediaId
        media {
          id
          format
          popularity
          countryOfOrigin
          title {
            romaji
            english
          }
        }
      }
    }
  } 
`;

const EPISODE_DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      episodes
      title {
        romaji
        english
      }
      externalLinks {
        url
        site
        type
        language
        isDisabled
      }
    }
  }
`;

export async function fetchNext24Hours(): Promise<AiringSchedule[]> {
  const now = Math.floor(Date.now() / 1000);
  const tomorrow = now + 86400;

  console.log(`[AniList] Scouting schedule from ${now} to ${tomorrow}`);

  let page = 1;
  let hasNextPage = true;
  let allSchedules: AiringSchedule[] = [];

  while (hasNextPage) {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        query: DAILY_SCHEDULE_QUERY,
        variables: { from: now, to: tomorrow, page: page }
      })
    };

    const response = await fetch(API_URL, options) as any;
    if (!response.ok) {
      throw new Error(`AniList schedule fetch failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.debug(`[Anlist] fetched in daily schedule page ${page} is ${JSON.stringify(data)}`);

    const schedules = data?.data?.Page?.airingSchedules;
    allSchedules.push(...schedules);
    hasNextPage = data?.data?.Page?.pageInfo?.hasNextPage;
    page++;
  }

  return allSchedules;
}

export async function fetchLiveEpisodeData(mediaId: number): Promise<EpisodeSchedule> {
  console.log(`[AniList] Fetching live data for Media ID: ${mediaId}`);

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      query: EPISODE_DETAILS_QUERY,
      variables: { id: mediaId }
    })
  };

  const response = await fetch(API_URL, options) as any;
  console.debug(`[Anlist] fetched episode respone is ${JSON.stringify(response)}`)
  if (!response.ok) {
    throw new Error(`AniList live details fetch failed with status: ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.Media || null;
}