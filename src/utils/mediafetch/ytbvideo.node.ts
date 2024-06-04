import ytdl from 'ytdl-core';
import { Platform } from 'react-native';
import { logger } from '../Logger';
import SongTS from '@objects/Song';
import { Source } from '@enums/MediaFetch';

const resolveIOSURL = (formats: ytdl.videoFormat[]) => {
  // iOS can't play OGG, but mp4a is fine.
  // iOS audio only mp4a has double the duration, but why?
  // this is observable in safari.
  // for now use the video + audio format that is fine.
  // maybe we can "fix" this via setDuration?
  const filteredFormats = formats.filter(format =>
    format.codecs.includes('mp4a')
  );
  const combinedFormats = filteredFormats.filter(
    format => format.hasVideo && format.hasAudio
  );
  return ytdl.chooseFormat(
    combinedFormats.length === 0 ? filteredFormats : combinedFormats,
    {
      quality: 'highestaudio',
    }
  ).url;
};

export const resolveURL = async (song: NoxMedia.Song, iOS = true) => {
  const sid = song.bvid;
  try {
    logger.debug(`fetch YTB playURL promise:${sid}`);
    const ytdlInfo = await ytdl.getInfo(
      `https://www.youtube.com/watch?v=${sid}`
    );
    const videoDetails = ytdlInfo.videoDetails;
    const url =
      Platform.OS === 'ios' && iOS
        ? resolveIOSURL(ytdlInfo.formats)
        : ytdl.chooseFormat(ytdlInfo.formats, { quality: 'highestaudio' }).url;
    return {
      url,
      cover: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      loudness: ytdlInfo.player_response.playerConfig.audioConfig.loudnessDb,
      perceivedLoudness:
        ytdlInfo.player_response.playerConfig.audioConfig.perceptualLoudnessDb,
    };
  } catch (e) {
    logger.error(`[ytbVideoresolve]: ${e}`);
    throw e;
  }
};

export const fetchAudioInfo = async (sid: string) => {
  logger.info(`calling fetch YTB info of sid ${sid}`);
  const ytdlInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${sid}`);
  try {
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
        cid: `${Source.ytbvideo}-${sid}`,
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
        source: Source.ytbvideo,
        metadataOnLoad: true,
      }),
    ];
  } catch (error) {
    logger.error(error);
    logger.warn(`Some issue happened when fetching biliAudio ${sid}`);
    return [];
  }
};

export const suggest = async (
  song: NoxMedia.Song,
  filterMW = <T>(v: T[]) => v[0]
) => {
  const ytdlInfo = await ytdl.getInfo(
    `https://www.youtube.com/watch?v=${song.bvid}`
  );
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
  const relatedVideos = ytdlInfo.related_videos
    .filter(song => song.id)
    .map(suggestSong =>
      SongTS({
        cid: `${Source.ytbvideo}-${suggestSong.id}`,
        bvid: suggestSong.id!,
        name: suggestSong.title!,
        nameRaw: suggestSong.title!,
        // string is a to be removed type so this is safe
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        singer: String(suggestSong.author.name),
        // string is a to be removed type so this is safe
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        singerId: String(suggestSong.author.channel_url),
        cover: suggestSong.thumbnails[0].url,
        lyric: '',
        page: 1,
        duration: Number(suggestSong.length_seconds),
        album: suggestSong.title,
        source: Source.ytbvideo,
        metadataOnLoad: true,
      })
    );
  return filterMW(relatedVideos); // or relatedVideos[0];
};
