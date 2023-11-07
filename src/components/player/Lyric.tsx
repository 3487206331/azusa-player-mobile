/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Button, TextInput
} from 'react-native';
import { Lrc as Lyric } from 'react-native-lyric';
import { Track, useProgress } from 'react-native-track-player';
import { IconButton } from 'react-native-paper';

import { searchLyricOptions, searchLyric } from '@utils/LyricFetch';
import { reExtractSongName } from '@stores/appStore';
import { useNoxSetting } from '@hooks/useSetting';
import { logger } from '@utils/Logger';

const LYRIC_OFFSET_INTERVAL = 0.5;

interface ModalContainerProps {
  children: React.JSX.Element[];
  visible: boolean;
  onRequestClose: () => void;
}

interface LyricLineProps {
  lrcLine: { millisecond: number; content: string };
  index: number;
  active: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useHasLrcFromLocal = (
  track: Track,
  lyricMapping: Map<string, NoxMedia.LyricDetail>
) => {
  return useMemo(
    () => lyricMapping.has(track?.song?.id),
    [track, lyricMapping]
  );
};

export const ModalContainer: React.FC<ModalContainerProps> = ({
  children,
  visible,
  onRequestClose,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalView}>{children}</View>
      </View>
    </Modal>
  );
};

interface LyricViewProps {
  track: Track;
  artist: string;
  height?: number;
  showUI?: boolean;
  noScrollThrottle?: boolean;
  onPress?: () => void;
}

export const LyricView = ({
  track,
  artist,
  height,
  showUI = true,
  noScrollThrottle = true,
  onPress = () => undefined,
}: LyricViewProps) => {
  const { position } = useProgress();
  const [lrc, setLrc] = useState('正在加载歌词...');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lrcOptions, setLrcOptions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lrcOption, setLrcOption] = useState<any>();
  const [modalVisible, setModalVisible] = useState(false);
  const [lyricSearchModalVisible, setLyricSearchModalVisible] = useState(false);
  const [currentTimeOffset, setCurrentTimeOffset] = useState(0);
  const [offsetModalVisible, setOffsetModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const playerStyle = useNoxSetting(state => state.playerStyle);
  const lyricMapping = useNoxSetting(state => state.lyricMapping);
  const setLyricMapping = useNoxSetting(state => state.setLyricMapping);

  useEffect(() => {
    if (track !== undefined && track.title !== '') {
      logger.log('Initiating Lyric with new track...');
      setCurrentTimeOffset(0);
      setLrcOption(null);
      setLrc('正在加载歌词...');
      setSearchText(track.title || "");
      // Initialize from storage if not new
      if (hasLrcFromLocal()) {
        logger.log('Loading Lrc from localStorage...');
        const lrcDetail = lyricMapping.get(track?.song.id);
        if (lrcDetail === undefined) return;
        searchLyric(lrcDetail?.lyricKey, setLrc);
        setLrcOption({ key: lrcDetail?.lyricKey });
        setCurrentTimeOffset(lrcDetail!.lyricOffset);
      }
      fetchAndSetLyricOptions();
    }
  }, [track]);

  useEffect(() => {
    if (!hasLrcFromLocal()) searchAndSetCurrentLyric();
  }, [lrcOptions]);

  const hasLrcFromLocal = () => {
    return lyricMapping.has(track?.song?.id);
  };

  const updateLyricMapping = () => {
    if (lrcOption !== null && lrcOption !== undefined) {
      const newLrcDetail: NoxMedia.LyricDetail = {
        songId: track.song.id,
        lyricKey: lrcOption.key,
        lyricOffset: currentTimeOffset,
      };
      setLyricMapping(newLrcDetail);
    }
  };

  const addSubtractOffset = (isAdd: boolean) => {
    const newTimeOffset = isAdd
      ? currentTimeOffset + LYRIC_OFFSET_INTERVAL
      : currentTimeOffset - LYRIC_OFFSET_INTERVAL;
    setCurrentTimeOffset(newTimeOffset);
    updateLyricMapping();
  };

  const fetchAndSetLyricOptions = async (adhocTitle?: string) => {
    if (track.title === undefined) return;
    try {
      let titleToFetch = adhocTitle === undefined ? track.title : adhocTitle;
      if (adhocTitle !== undefined)
        titleToFetch = reExtractSongName(titleToFetch, artist);
      else titleToFetch = reExtractSongName(track.title, artist);
      const options = await searchLyricOptions(titleToFetch);

      setLrcOptions(options);
    } catch (error) {
      logger.error(`Error fetching lyric options:${error}`);
      setLrcOptions([]);
    }
  };

  const searchAndSetCurrentLyric = (index?: number) => {
    console.debug(`lrcoptions: ${JSON.stringify(lrcOptions)}`);

    index = index === undefined ? 0 : index;
    if (lrcOptions.length === 0) setLrc('无法找到歌词,请手动搜索...');
    else {
      searchLyric(lrcOptions[index!].songMid, setLrc);
      setLrcOption(lrcOptions[index!]);
      updateLyricMapping();
    }
  };

  const LyricOptions = (key: string) => {
    setModalVisible(false);
    switch (key) {
      case 'LyricOptions': {
        setLyricSearchModalVisible(true);
        break;
      }
      case 'LyricOffset': {
        setOffsetModalVisible(true);
        break;
      }
    }
  };

  const lineRenderer = useCallback(
    ({ lrcLine: { content }, active }: LyricLineProps) => (
      <View style={{ padding: 7 }}>
        <Text
          style={{
            textAlign: 'center',
            color: active
              ? playerStyle.colors.primary
              : playerStyle.colors.secondary,
          }}
        >
          {content}
        </Text>
      </View>
    ),
    [playerStyle]
  );

  const customizedStyles = {
    headerText: [styles.headerText, {color: playerStyle.colors.primary}],
    modelContainer: [
      styles.modalHeader,
      { backgroundColor: playerStyle.colors.primaryContainer },
    ]
  }

  return (
    <View style={styles.container}>
      <Lyric
        style={{ marginTop: 30, height: 500 }}
        lrc={lrc}
        currentTime={(position + currentTimeOffset) * 1000}
        lineHeight={32}
        lineRenderer={lineRenderer}
        height={height}
        noScrollThrottle={noScrollThrottle}
        onPress={onPress}
      />
      {showUI && (
        <>
          <View style={styles.optionsButton}>
            <IconButton
              icon="more"
              onPress={() => setModalVisible(!modalVisible)}
            />
          </View>
          <ModalContainer
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View
              style={customizedStyles.modelContainer}
            >
              <Text style={customizedStyles.headerText}>更多</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconButton iconColor={playerStyle.colors.primary} icon="chevron-down" />
              </TouchableOpacity>
            </View>
            <FlatList
              style={{backgroundColor: playerStyle.colors.primaryContainer}}
              data={[
                { key: 'LyricOptions', title: '更换歌词' },
                { key: 'LyricOffset', title: '歌词时间调整' },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => LyricOptions(item.key)}>
                  <Text style={[styles.listItem, {color: playerStyle.colors.secondary}]}>{item.title}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.key}
            />
          </ModalContainer>

          <ModalContainer
            visible={lyricSearchModalVisible}
            onRequestClose={() => setLyricSearchModalVisible(false)}
          >
            <View
              style={customizedStyles.modelContainer}
            >
              <Text style={customizedStyles.headerText}>歌词搜索</Text>
              <TouchableOpacity
                onPress={() => setLyricSearchModalVisible(false)}
              >
                <IconButton iconColor={playerStyle.colors.primary} icon="chevron-down" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.searchBar, {backgroundColor: playerStyle.colors.primaryContainer, color: playerStyle.colors.primary}]}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={track === undefined ? '' : track.title}
              onSubmitEditing={() => fetchAndSetLyricOptions(searchText)}
              selectionColor={playerStyle.customColors.textInputSelectionColor}
            />
            <FlatList
              style={{backgroundColor: playerStyle.colors.primaryContainer}}
              data={lrcOptions}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => searchAndSetCurrentLyric(index)}
                >
                  <Text style={[styles.listItem, {color: playerStyle.colors.secondary}]}>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.key}
            />
          </ModalContainer>

          <Modal
            animationType="fade"
            transparent={true}
            visible={offsetModalVisible}
            onRequestClose={() => setOffsetModalVisible(false)}
          >
            <View style={styles.offsetModalView}>
              <Button
                title="+"
                onPress={() => addSubtractOffset(true)}
                color={playerStyle.colors.primaryContainer}
              />
              <Text style={[styles.lyricOffsetText, {backgroundColor: playerStyle.colors.primaryContainer}]}>{currentTimeOffset}</Text>
              <Button
                title="-"
                onPress={() => addSubtractOffset(false)}
                color={playerStyle.colors.primaryContainer}
              />
              <Button
                title="X"
                onPress={() => setOffsetModalVisible(false)}
                color={playerStyle.colors.primaryContainer}
              />
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  optionsButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1, // add this line
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'grey',
    padding: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },

  listItem: {
    padding: 10,
    fontSize: 16,
    borderTopColor: 'grey',
  },
  searchBar: {
    height: 40,
    paddingLeft: 15,
    backgroundColor: '#f0f0f0',
    fontSize: 16,
    color: '#333',
  },
  offsetModalView: {
    position: 'absolute',
    top: 30,
    right: 10,
    width: '10%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    alignItems: 'stretch',
    justifyContent: 'center',
  },

  lyricOffsetButton: {
    backgroundColor: 'grey',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 5,
  },
  lyricOffsetText: {
    fontSize: 12,
    color: 'black',
    textAlign: 'center',
    paddingVertical: 5,
  },
});
