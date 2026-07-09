type Id = string | number


/*
    * preventing duplicate jobs
*/
export const scheduleKey = (aniListId: Id, episodeNumber: Id): string => `schedule:${aniListId}:${episodeNumber}`;

/*
    * storing everything about discussion here
*/
// export const EpiodeThread = (aniListId: Id, episodeNumber: Id): string => `epsiodeThread:${aniListId}:${episodeNumber}`;

/*
    * Nothing to do with redis just for cancel post in dashbord and configure job
*/
export const jobId = (aniListId: Id, episodeNumber: Id): string => `jobId-${aniListId}-${episodeNumber}`;