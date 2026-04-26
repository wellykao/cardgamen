import { ref, onUnmounted } from 'vue'
import { TURN_TIMEOUT } from '@/engine/constants'

/** 出牌倒计时 */
export function useGameTimer() {
  const timeLeft = ref(TURN_TIMEOUT)
  const isRunning = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null

  function start(seconds: number = TURN_TIMEOUT) {
    stop()
    timeLeft.value = seconds
    isRunning.value = true

    intervalId = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        stop()
      }
    }, 1000)
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isRunning.value = false
  }

  function reset() {
    stop()
    timeLeft.value = TURN_TIMEOUT
  }

  onUnmounted(() => {
    stop()
  })

  return {
    timeLeft,
    isRunning,
    start,
    stop,
    reset,
  }
}
