import ytdl from 'ytdl-core';
/**
 * refactor:
 * bilisearch workflow:
 * reExtractSearch matches regex patterns and use the corresponding fetch functions;
 * fetch function takes extracted and calls a dataProcess.js fetch function;
 * dataprocess fetch function fetches VIDEOINFO using data.js fetch function, then parses into SONGS
 * data.js fetch function fetches VIDEOINFO.
 * steps to refactor:
 * each site needs a fetch to parse regex extracted, a videoinfo fetcher and a song fetcher.
 */
import { regexFetchProps } from './generic';
import { biliApiLimiter } from './throttle';

import SongTS from '../../objects/Song';
import { logger } from '../Logger';

const CIDPREFIX = 'youtube-';

const fetchYTBPlayUrlPromise = async (sid: string) => {
  try {
    logger.debug(`fetch YTB playURL promise:${sid}`);
    const ytdlInfo = await ytdl.getInfo(
      `https://www.youtube.com/watch?v=${sid}`
    );
    return ytdl.chooseFormat(ytdlInfo.formats, { quality: 'highestaudio' }).url;
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

export const fetchAudioInfoRaw = async (sid: string) => {
  logger.info(`calling fetch YTB info of sid`);
  const ytdlInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${sid}`);
  try {
    /*
    might be very useful for youtubeSuggest.
      related_videos: [
    {
      id: 'tCMrzOdmtcc',
      title: 'The Way You Move',
      published: '7 years ago',
      author: [Object],
      short_view_count_text: '25M',
      view_count: '25863244',
      length_seconds: 234,
      thumbnails: [Array],
      richThumbnails: [],
      isLive: false
    },
    */
    const relatedVideos = ytdlInfo.related_videos;
    /*
     videoDetails: {
    embed: {
      iframeUrl: 'https://www.youtube.com/embed/7EJbFg_LxjY',
      width: 960,
      height: 720
    },
    title: 'Rock Your Body',
    description: 'Provided to YouTube by Jive\n' +
      '\n' +
      'Rock Your Body · Justin Timberlake\n' +
      '\n' +
      'Justified\n' +
      '\n' +
      '℗ 2002 Zomba Recording LLC\n' +
      '\n' +
      'Released on: 2002-11-05\n' +
      '\n' +
      'All  Instruments, Composer, Lyricist, Producer: Chad Hugo\n' +
      'All  Instruments, Composer, Lyricist, Vocal  Arranger, Producer: Pharrell Williams\n' +
      'Background  Vocal: Vanessa Marquez\n' +
      'Recording  Engineer: Andrew Coleman\n' +
      'Recording  Engineer: Eddie DeLena\n' +
      'Mixing  Engineer: Serban Ghenea\n' +
      'Assistant  Engineer: Daniel Betancourth\n' +
      'Assistant  Engineer: Tim Roberts\n' +
      'Engineer: John Hanes\n' +
      'Mastering  Engineer: Herbie Powers Jr.\n' +
      '\n' +
      'Auto-generated by YouTube.',
    lengthSeconds: '268',
    ownerProfileUrl: 'http://www.youtube.com/channel/UC6VwktUsQQDCkHG1h6YftAQ',
    externalChannelId: 'UC6VwktUsQQDCkHG1h6YftAQ',
    isFamilySafe: true,
    availableCountries: [
      'AE', 'AR', 'AS', 'AT', 'AU', 'AW', 'BA', 'BE', 'BG', 'BH',
      'BM', 'BO', 'BR', 'BY', 'CA', 'CH', 'CL', 'CO', 'CR', 'CY',
      'CZ', 'DE', 'DK', 'DO', 'DZ', 'EC', 'EE', 'EG', 'ES', 'FI',
      'FR', 'GB', 'GF', 'GP', 'GR', 'GT', 'GU', 'HK', 'HN', 'HR',
      'HU', 'ID', 'IE', 'IL', 'IN', 'IS', 'IT', 'JO', 'JP', 'KE',
      'KR', 'KW', 'KY', 'LB', 'LI', 'LT', 'LU', 'LV', 'MA', 'MK',
      'MP', 'MQ', 'MT', 'MX', 'MY', 'NC', 'NG', 'NI', 'NL', 'NO',
      'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PL', 'PR', 'PT',
      'PY', 'QA', 'RO', 'RS', 'RU', 'SA', 'SE', 'SG', 'SI', 'SK',
      'SV', 'TC', 'TH', 'TR', 'TW', 'UA', 'US', 'UY', 'VE', 'VI',
      ... 3 more items
    ],
    isUnlisted: false,
    hasYpcMetadata: false,
    viewCount: '39899962',
    category: 'Music',
    publishDate: '2015-08-11',
    ownerChannelName: 'Justin Timberlake - Topic',
    uploadDate: '2015-08-11',
    videoId: '7EJbFg_LxjY',
    keywords: [
      'Justin Timberlake',
      'ジャスティンティンバーレイク',
      '賈斯汀',
      'Justified',
      'Rock Your Body'
    ],
    channelId: 'UC6VwktUsQQDCkHG1h6YftAQ',
    isOwnerViewing: false,
    isCrawlable: true,
    allowRatings: true,
    author: {
      id: 'UC-y8ci7xfsu4L3zkSuHae0A',
      name: 'Justin Timberlake - Topic',
      user: 'UC6VwktUsQQDCkHG1h6YftAQ',
      channel_url: 'https://www.youtube.com/channel/UC-y8ci7xfsu4L3zkSuHae0A',
      external_channel_url: 'https://www.youtube.com/channel/UC6VwktUsQQDCkHG1h6YftAQ',
      user_url: 'http://www.youtube.com/channel/UC6VwktUsQQDCkHG1h6YftAQ',
      thumbnails: [Array],
      verified: false,
      subscriber_count: 10200000
    },
    isPrivate: false,
    isUnpluggedCorpus: false,
    isLiveContent: false,
    media: {},
    likes: null,
    dislikes: null,
    age_restricted: false,
    video_url: 'https://www.youtube.com/watch?v=7EJbFg_LxjY',
    storyboards: [ [Object], [Object], [Object] ],
    chapters: [],
    thumbnails: [ [Object], [Object], [Object], [Object], [Object] ]
  },
  full: true
}
    */
    const videoDetails = ytdlInfo.videoDetails;
    const validDurations = ytdlInfo.formats.filter(
      format => format.approxDurationMs
    );
    return [
      SongTS({
        cid: `${CIDPREFIX}-${sid}`,
        bvid: sid,
        name: videoDetails.title,
        nameRaw: videoDetails.title,
        singer: videoDetails.author.name,
        singerId: videoDetails.author.channel_url,
        cover: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
        lyric: '',
        page: 1,
        duration:
          validDurations.length > 0
            ? Math.floor(
                Number.parseInt(validDurations[0].approxDurationMs!) / 1000
              )
            : 0,
        album: videoDetails.title,
      }),
    ];
  } catch (error) {
    logger.error(error);
    logger.warn(`Some issue happened when fetching biliAudio ${sid}`);
  }
};

export const fetchAudioInfo = async (
  bvid: string,
  progressEmitter: () => void = () => undefined
) =>
  await biliApiLimiter.schedule(() => {
    progressEmitter();
    return fetchAudioInfoRaw(bvid);
  });

const regexFetch = async ({ reExtracted, useBiliTag }: regexFetchProps) => {
  const audioInfo = await fetchAudioInfo(reExtracted[1]!);
  return audioInfo || [];
};

const resolveURL = (song: NoxMedia.Song) => fetchYTBPlayUrlPromise(song.bvid);

const refreshSong = (song: NoxMedia.Song) => song;

export default {
  regexSearchMatch: /youtu(?:.*\/v\/|.*v=|\.be\/)([A-Za-z0-9_-]{11})/,
  regexFetch,
  regexResolveURLMatch: /^youtube-/,
  resolveURL,
  refreshSong,
};
