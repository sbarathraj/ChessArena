import { Platform } from 'react-native';

const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

let AudioModule: typeof import('expo-av').Audio | null = null;
if (!isTest) {
  try {
    // Dynamic import to avoid breaking Jest in node environment
    const expoAv = require('expo-av');
    AudioModule = expoAv.Audio;
    if (AudioModule && AudioModule.setAudioModeAsync) {
      AudioModule.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      }).catch(() => {});
    }
  } catch {
    AudioModule = null;
  }
}

const moveSoundAsset = require('../../../assets/sounds/move.wav');
const captureSoundAsset = require('../../../assets/sounds/capture.wav');
const checkSoundAsset = require('../../../assets/sounds/check.wav');

export interface SoundOptions {
  captured?: boolean;
  isCheck?: boolean;
}

/**
 * KnightArena Authentic Chess Sound Service
 * Plays tactile piece/coin movement sound effects on every move, capture, or check.
 */
export async function playMoveSound(options?: SoundOptions): Promise<void> {
  if (isTest || !AudioModule) return;

  try {
    const asset = options?.isCheck
      ? checkSoundAsset
      : options?.captured
      ? captureSoundAsset
      : moveSoundAsset;

    const { sound } = await AudioModule.Sound.createAsync(
      asset,
      { shouldPlay: true, volume: 1.0 }
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    // Graceful fallback: audio issues must never interrupt chess move execution
  }
}

export const SoundService = {
  playMoveSound,
};
