import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RoomInfo, Player } from '@/engine'

export const useLobbyStore = defineStore('lobby', () => {
  // 玩家信息
  const playerName = ref('')
  const playerAvatar = ref('')
  const isPlayerLoggedIn = ref(false)

  // 大厅状态
  const rooms = ref<RoomInfo[]>([])
  const isMatching = ref(false)
  const currentRoom = ref<RoomInfo | null>(null)

  // AI名字池
  const aiNames = ['小明', '小红', '大壮', '阿华', '美美', '老王', '小李', '阿强']
  const avatarList = [
    'https://placehold.co/80x80/4CAF50/FFFFFF?text=😎',
    'https://placehold.co/80x80/2196F3/FFFFFF?text=🤠',
    'https://placehold.co/80x80/FF9800/FFFFFF?text=🤖',
    'https://placehold.co/80x80/E91E63/FFFFFF?text=🦊',
  ]

  // 登录
  function login(name: string, avatar: string) {
    playerName.value = name
    playerAvatar.value = avatar
    isPlayerLoggedIn.value = true

    // 生成模拟房间
    generateMockRooms()
  }

  // 生成模拟房间
  function generateMockRooms() {
    rooms.value = [
      {
        id: 'room_001',
        name: '新手大厅',
        players: createMockPlayers(2),
        maxPlayers: 4,
        status: 'waiting',
        createdAt: Date.now() - 300000,
      },
      {
        id: 'room_002',
        name: '高手竞技',
        players: createMockPlayers(3),
        maxPlayers: 4,
        status: 'waiting',
        createdAt: Date.now() - 120000,
      },
      {
        id: 'room_003',
        name: '休闲对局',
        players: createMockPlayers(4),
        maxPlayers: 4,
        status: 'playing',
        createdAt: Date.now() - 60000,
      },
    ]
  }

  // 创建模拟玩家
  function createMockPlayers(count: number): Player[] {
    const players: Player[] = []
    for (let i = 0; i < count; i++) {
      players.push({
        id: i,
        name: aiNames[i] || `玩家${i}`,
        avatar: avatarList[i] || '',
        hand: [],
        collected: [],
        score: 0,
        isAI: true,
        isReady: true,
        seatIndex: i,
      })
    }
    return players
  }

  // 创建房间
  function createRoom(roomName: string): RoomInfo {
    const room: RoomInfo = {
      id: `room_${Date.now()}`,
      name: roomName,
      players: [{
        id: 0,
        name: playerName.value,
        avatar: playerAvatar.value,
        hand: [],
        collected: [],
        score: 0,
        isAI: false,
        isReady: true,
        seatIndex: 0,
      }],
      maxPlayers: 4,
      status: 'waiting',
      createdAt: Date.now(),
    }
    rooms.value.unshift(room)
    currentRoom.value = room
    return room
  }

  // 快速匹配 - 直接开始游戏（玩家+3AI）
  async function quickMatch(): Promise<RoomInfo> {
    isMatching.value = true

    try {
      // 模拟匹配延时
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

      // 直接创建新房间，玩家 + 3个AI，立即开始
      const room = createRoom(`${playerName.value}的房间`)
      for (let i = 1; i < 4; i++) {
        room.players.push({
          id: i,
          name: aiNames[i],
          avatar: avatarList[i],
          hand: [],
          collected: [],
          score: 0,
          isAI: true,
          isReady: true,
          seatIndex: i,
        })
      }
      room.status = 'playing'
      currentRoom.value = room

      return currentRoom.value!
    } finally {
      isMatching.value = false
    }
  }

  // 取消匹配
  function cancelMatch() {
    isMatching.value = false
  }

  // 获取游戏玩家名字列表
  function getGamePlayerNames(): string[] {
    if (!currentRoom.value) return [playerName.value, ...aiNames.slice(0, 3)]
    return currentRoom.value.players.map(p => p.name)
  }

  function getGamePlayerAvatars(): string[] {
    if (!currentRoom.value) return avatarList
    return currentRoom.value.players.map(p => p.avatar)
  }

  return {
    playerName,
    playerAvatar,
    isPlayerLoggedIn,
    rooms,
    isMatching,
    currentRoom,
    avatarList,
    login,
    createRoom,
    quickMatch,
    cancelMatch,
    getGamePlayerNames,
    getGamePlayerAvatars,
  }
})
