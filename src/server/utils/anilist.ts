const API_URL = 'https://graphql.anilist.co';

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
            native
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
      title {
        romaji
        english
        native
      }
      episodes
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

export async function fetchNext24Hours(): Promise<any> {
  const now = Math.floor(Date.now() / 1000);
  const tomorrow = now + 86400;

  console.log(`[AniList] Scouting schedule from ${now} to ${tomorrow}`);

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      query: DAILY_SCHEDULE_QUERY,
      variables: { from: now, to: tomorrow, page: 1 }
    })
  };

  const response = await fetch(API_URL, options) as any;
  if (!response.ok) {
    throw new Error(`AniList schedule fetch failed with status: ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.Page?.airingSchedules || [];
}

export async function fetchLiveEpisodeData(mediaId: number): Promise<any> {
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
  if (!response.ok) {
    throw new Error(`AniList live details fetch failed with status: ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.Media || null;
}