type Id = string | number


/*
    * preventing duplicate jobs
*/
export const scheduleKey = (aniListId: Id, episodeNumber: Id): string => `schedule:${aniListId}:${episodeNumber}`;

/*
    * storing everything about discussion here
    * not using this
*/
export const EpiodeThread = (aniListId: Id, episodeNumber: Id): string => `epsiodeThread:${aniListId}:${episodeNumber}`;

/*
    * Nothing to do with redis just for cancel post in dashbord and configure job
*/
export const jobId = (aniListId: Id, episodeNumber: Id): string => `jobId-${aniListId}-${episodeNumber}`;

/*
    * storing everything about poll here
    * pollMeta stores meta data expirationTimestamp,allowMultipleVotes
    * pollOptions stores option index mapped to option text
    * pollVotes stores option index mapped to vote count
    * pollVoters stores user id mapped to option index
*/
export const pollMeta = (postId: Id): string => `poll:${postId}:meta`
export const pollOptions = (postId: Id): string => `poll:${postId}:options`
export const pollVotes = (postId: Id): string => `poll:${postId}:votes`
export const pollVoters = (postId: Id): string => `poll:${postId}:voters`