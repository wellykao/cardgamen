import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const soundVolume = ref(0.7)
  const musicVolume = ref(0.5)
  const animationSpeed = ref(1.0)  // 1.0 = 正常速度
  const isSoundEnabled = ref(true)
  const isMusicEnabled = ref(true)
  const showLogPanel = ref(true)
  const showScorePopup = ref(true)

  function setSoundVolume(v: number) { soundVolume.value = Math.max(0, Math.min(1, v)) }
  function setMusicVolume(v: number) { musicVolume.value = Math.max(0, Math.min(1, v)) }
  function setAnimationSpeed(v: number) { animationSpeed.value = Math.max(0.5, Math.min(2, v)) }
  function toggleSound() { isSoundEnabled.value = !isSoundEnabled.value }
  function toggleMusic() { isMusicEnabled.value = !isMusicEnabled.value }
  function toggleLogPanel() { showLogPanel.value = !showLogPanel.value }
  function toggleScorePopup() { showScorePopup.value = !showScorePopup.value }

  return {
    soundVolume, musicVolume, animationSpeed,
    isSoundEnabled, isMusicEnabled,
    showLogPanel, showScorePopup,
    setSoundVolume, setMusicVolume, setAnimationSpeed,
    toggleSound, toggleMusic, toggleLogPanel, toggleScorePopup,
  }
})
