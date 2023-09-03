import { regexFetchProps } from './generic';

import SongTS from '@objects/Song';
import { logger } from '../Logger';
import bfetch from '../BiliFetch';
import { CIDPREFIX } from './bililive';
import { fetchBiliPaginatedAPI } from './paginatedbili';
import VideoInfo from '@objects/VideoInfo';

// https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/live/info.md#%E6%89%B9%E9%87%8F%E6%9F%A5%E8%AF%A2%E7%9B%B4%E6%92%AD%E9%97%B4%E7%8A%B6%E6%80%81
const getRoomInfos = async (uids: number[]) => {
  logger.info(`[biliLive] calling fetchVideoInfo of ${uids}`);
  const response = await bfetch(
    'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        uids,
      },
    }
  );
  const json = await response.json();
  return Object.values(json.data).map(
    (roomInfo: any) =>
      new VideoInfo(
        roomInfo.title,
        `b站直播间${roomInfo.room_id}`,
        0,
        roomInfo.cover_from_user,
        { mid: roomInfo.uid, name: roomInfo.uname, face: '' },
        [],
        roomInfo.room_id,
        0
      )
    /*
    SongTS({
      cid: `${CIDPREFIX}-${roomInfo.room_id}`,
      bvid: roomInfo.room_id,
      name: roomInfo.title,
      singer: roomInfo.uname,
      cover: roomInfo.cover_from_user,
      singerId: roomInfo.uid,
      album: `b站直播间${roomInfo.room_id}`,
      source: CIDPREFIX,
      isLive: true,
      liveStatus: roomInfo.live_status === 1,
    })
  */
  );
};

const videoInfo2Song = (val: VideoInfo) =>
  SongTS({
    ...val,
    cid: `${CIDPREFIX}-${val.bvid}`,
    source: CIDPREFIX,
    name: val.title,
    singer: val.uploader.name,
    singerId: val.uploader.mid,
    cover: val.picSrc,
  });
const getSubList = async (
  uid: string,
  progressEmitter: (val: number) => void = () => undefined,
  favList: string[] = []
) => {
  // https://api.bilibili.com/x/relation/followings?vmid=3493085134719196
  const videoInfos = await fetchBiliPaginatedAPI({
    url: `https://api.bilibili.com/x/relation/followings?vmid=${uid}&pn={pn}`,
    // dont get more than 5 pages?
    // getMediaCount: (data: any) => Math.min(250, data.total),
    getMediaCount: (data: any) => data.total,
    getPageSize: () => 50,
    getItems: (js: any) => js.data.list,
    progressEmitter,
    favList,
    resolveBiliBVID: async bvobjs =>
      await getRoomInfos(bvobjs.map((obj: any) => obj.bvid)),
  });
  return videoInfos.map(info => videoInfo2Song(info));
};

const regexFetch = async ({
  reExtracted,
  progressEmitter = () => undefined,
  favList,
}: regexFetchProps) => getSubList(reExtracted[1]!, progressEmitter, favList);

export default {
  regexSearchMatch: /space\.bilibili\.com\/(\d+)\/fans\/follow/,
  regexFetch,
};
