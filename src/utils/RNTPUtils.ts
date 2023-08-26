import { Animated, Platform, AppState } from 'react-native';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  UpdateOptions,
} from 'react-native-track-player';

import { getPlaybackModeNotifIcon } from '../stores/playingList';
import logger from './Logger';

const animatedVolume = new Animated.Value(1);

animatedVolume.addListener(state => TrackPlayer.setVolume(state.value));

interface animatedVolumeChangeProps {
  val: number;
  duration?: number;
  init?: number;
  callback?: () => void;
}

/**
 * to use: duration is the fade interval,
 * when song starts/R128gain is set, set init = 0.
 */
export const animatedVolumeChange = ({
  val,
  duration = 0,
  init = -1,
  callback = () => undefined,
}: animatedVolumeChangeProps) => {
  logger.debug(
    `[FADING] animating volume from ${init} to ${val} in ${duration}; ${AppState.currentState}`
  );
  if (AppState.currentState !== 'active') {
    // need to figure out a way to run Animated.timing in background. probably needs our own module
    duration = 0;
  }
  val = Math.min(val, 1);
  if (duration === 0) {
    animatedVolume.setValue(val);
    callback();
    return;
  }
  if (init !== -1) {
    animatedVolume.setValue(init);
  }
  animatedVolume.stopAnimation();
  Animated.timing(animatedVolume, {
    toValue: val,
    useNativeDriver: true,
    duration,
  }).start(() => callback());
};

/**
 * see export function useSetupPlayer.
 * wait SetupService(serviceOptions) is called after await initPlayer(await initPlayerObject())
 * and because initializePlaybackMode(val.playerRepeat) is called within initPlayer
 * playlistStore.playmode is already set
 * this should return the correct icon for playback mode.
 */
export const initRNTPOptions = () => {
  const options: UpdateOptions = {
    android: {
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    // This flag is now deprecated. Please use the above to define playback mode.
    // stoppingAppPausesPlayback: true,
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
    progressUpdateEventInterval: 1,
  };
  if (Platform.OS === 'android') {
    options.capabilities = options.capabilities!.concat([
      Capability.JumpBackward,
    ]);
    options.compactCapabilities = options.compactCapabilities!.concat([
      Capability.JumpBackward,
    ]);
    options.forwardJumpInterval = 1;
    options.backwardJumpInterval = 1;
    options.rewindIcon = getPlaybackModeNotifIcon()[0];
  }
  return options;
};
