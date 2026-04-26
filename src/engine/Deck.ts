import { Card } from './types'
import { createFullDeck } from './Card'
import { INITIAL_HAND_SIZE, INITIAL_TABLE_SIZE, PLAYER_COUNT } from './constants'

/** 牌组管理类 */
export class Deck {
  private cards: Card[] = []

  /** 初始化并洗牌 */
  init(): void {
    this.cards = createFullDeck()
    this.shuffle()
  }

  /** Fisher-Yates洗牌 */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
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
