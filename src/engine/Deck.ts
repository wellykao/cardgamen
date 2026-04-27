import { Card } from './types'
import { createFullDeck } from './Card'
import { INITIAL_HAND_SIZE, INITIAL_TABLE_SIZE, PLAYER_COUNT } from './constants'

/** 简单的确定性随机数生成器（基于种子） */
function createSeededRandom(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return function () {
    hash = ((hash * 16807) % 2147483647) | 0
    return (hash & 0x7fffffff) / 0x7fffffff
  }
}

/** 牌组管理类 */
export class Deck {
  private cards: Card[] = []
  private seed: string = ''

  /** 初始化并洗牌 */
  init(seed?: string): void {
    this.cards = createFullDeck()
    if (seed) {
      this.seed = seed
      this.shuffleWithSeed(seed)
    } else {
      this.seed = ''
      this.shuffle()
    }
  }

  /** 获取当前种子 */
  get currentSeed(): string {
    return this.seed
  }

  /** Fisher-Yates洗牌（随机） */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  /** 基于种子的确定性洗牌 */
  shuffleWithSeed(seed: string): void {
    const rand = createSeededRandom(seed)
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  /** 从已排序的牌ID列表初始化（用于恢复状态） */
  initFromOrder(cardIds: string[]): void {
    const fullDeck = createFullDeck()
    const cardMap = new Map(fullDeck.map(c => [c.id, c]))
    this.cards = cardIds.map(id => cardMap.get(id)!).filter(Boolean)
  }

  /** 获取当前牌序（用于保存状态） */
  getCardOrder(): string[] {
    return this.cards.map(c => c.id)
  }

  /** 发手牌：每人6张 */
  dealHands(): Card[][] {
    const hands: Card[][] = []
    for (let i = 0; i < PLAYER_COUNT; i++) {
      hands.push(this.cards.splice(0, INITIAL_HAND_SIZE))
    }
    return hands
  }

  /** 发桌面公共牌：4张 */
  dealTableCards(): Card[] {
    return this.cards.splice(0, INITIAL_TABLE_SIZE)
  }

  /** 翻一张牌到桌面 */
  flipCard(): Card | null {
    if (this.cards.length === 0) return null
    return this.cards.shift()!
  }

  /** 剩余牌数 */
  get remaining(): number {
    return this.cards.length
  }

  /** 是否还有牌可翻 */
  get hasCards(): boolean {
    return this.cards.length > 0
  }

  /** 重置 */
  reset(): void {
    this.cards = []
  }
}
