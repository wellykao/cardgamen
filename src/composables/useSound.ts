import { ref } from 'vue'
import { Howl } from 'howler'
import { useSettingsStore } from '@/stores/settingsStore'

/** 音效类型 */
type SoundType = 'playCard' | 'collectCard' | 'flipCard' | 'victory' | 'click' | 'timeout'

/** 音效管理 */
const sounds: Record<SoundType, Howl | null> = {
  playCard: null,
  collectCard: null,
  flipCard: null,
  victory: null,
  click: null,
  timeout: null,
}

/** 初始化音效（懒加载） */
function ensureSound(type: SoundType): Howl | null {
  if (sounds[type]) return sounds[type]

  // 音效文件路径映射（暂时用空占位，实际需要音效文件）
  const soundMap: Record<SoundType, string> = {
    playCard: '/sounds/play.mp3',
    collectCard: '/sounds/collect.mp3',
    flipCard: '/sounds/flip.mp3',
    victory: '/sounds/victory.mp3',
    click: '/sounds/click.mp3',
    timeout: '/sounds/timeout.mp3',
  }

  try {
    sounds[type] = new Howl({
      src: [soundMap[type]],
      volume: 0.7,
      preload: false,
    })
  } catch {
    console.error('Failed to load sound:', type)
  }

  return sounds[type]
}

/** 播放音效 */
export function playSound(type: SoundType): void {
  const settings = useSettingsStore()
  if (!settings.isSoundEnabled) return

  const sound = ensureSound(type)
  if (sound) {
    sound.volume(settings.soundVolume)
    sound.play()
  }
}

/** composable形式 */
export function useSound() {
  return { playSound }
}
