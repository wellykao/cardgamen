import { ref } from 'vue'
import { AnimStep } from '@/engine'

/**
 * 动画队列控制器
 * 串行执行动画步骤，每步强制delay停留
 */
export function useAnimationQueue() {
  const isRunning = ref(false)
  const currentStep = ref<string>('')
  const queue: AnimStep[] = []
  let abortController: AbortController | null = null

  /** 入队单步动画 */
  async function enqueue(step: AnimStep, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return
    currentStep.value = step.action
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, step.delay)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new Error('Aborted'))
      })
    }).catch(() => {})
  }

  /** 入队批量动画 */
  async function enqueueBatch(steps: AnimStep[], signal?: AbortSignal): Promise<void> {
    for (const step of steps) {
      if (signal?.aborted) break
      await enqueue(step, signal)
    }
  }

  /** 启动队列执行 */
  async function start(steps: AnimStep[]): Promise<void> {
    if (isRunning.value) return
    isRunning.value = true
    abortController = new AbortController()

    try {
      await enqueueBatch(steps, abortController.signal)
    } finally {
      isRunning.value = false
      currentStep.value = ''
    }
  }

  /** 中断队列 */
  function abort() {
    abortController?.abort()
    isRunning.value = false
    currentStep.value = ''
  }

  return {
    isRunning,
    currentStep,
    enqueue,
    enqueueBatch,
    start,
    abort,
  }
}
