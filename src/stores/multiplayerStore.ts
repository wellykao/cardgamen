import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Room, type RoomPlayer, type GameMove } from '@/lib/supabase'
import type { GameState } from '@/engine'

export const useMultiplayerStore = defineStore('multiplayer', () => {
  // ========== 状态 ==========
  const currentRoom = ref<Room | null>(null)
  const roomPlayers = ref<RoomPlayer[]>([])
  const myPlayerId = ref<string>('')
  const mySeatIndex = ref<number>(-1)
  const isHost = computed(() => currentRoom.value?.host_id === myPlayerId.value)
  const isInRoom = computed(() => currentRoom.value !== null)
  const gameMoves = ref<GameMove[]>([])
  const isSyncing = ref(false)
  const connectionError = ref<string | null>(null)

  // 订阅句柄（每个表独立频道）
  let roomChannel: ReturnType<typeof supabase.channel> | null = null
  let playersChannel: ReturnType<typeof supabase.channel> | null = null
  let movesChannel: ReturnType<typeof supabase.channel> | null = null

  // 轮询句柄
  let pollTimer: ReturnType<typeof setInterval> | null = null

  // ========== 计算属性 ==========
  const sortedPlayers = computed(() => {
    return [...roomPlayers.value].sort((a, b) => a.seat_index - b.seat_index)
  })

  const allReady = computed(() => {
    return roomPlayers.value.length >= 2 && roomPlayers.value.every(p => p.is_ready)
  })

  const canStart = computed(() => {
    return isHost.value && allReady.value && currentRoom.value?.status === 'waiting'
  })

  // ========== 本地持久化 ==========

  function getStoredUserId(): string | null {
    try { return localStorage.getItem('mp_user_id') } catch { return null }
  }

  function storeUserId(userId: string) {
    try { localStorage.setItem('mp_user_id', userId) } catch { /* ignore */ }
  }

  function clearStoredUserId() {
    try { localStorage.removeItem('mp_user_id') } catch { /* ignore */ }
  }

  // ========== 房间管理 ==========

  function generateRoomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  function generateUserId(): string {
    return 'user_' + Math.random().toString(36).substring(2, 15)
  }

  /** 创建房间 */
  async function createRoom(name: string, playerName: string, avatar: string): Promise<Room> {
    const userId = getStoredUserId() || generateUserId()
    storeUserId(userId)
    myPlayerId.value = userId

    const roomCode = generateRoomCode()
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        room_code: roomCode,
        name: name || `房间${roomCode}`,
        status: 'waiting',
        host_id: userId,
        max_players: 4,
      })
      .select()
      .single()

    if (error || !room) {
      throw new Error('创建房间失败: ' + (error?.message || '未知错误'))
    }

    currentRoom.value = room

    // 先订阅，再加入，确保不遗漏事件
    subscribeToRoom(room.id)

    // 加入房间作为房主
    await joinRoomInternal(room.id, userId, playerName, avatar, 0)

    return room
  }

  /** 通过房间号加入 */
  async function joinRoomByCode(
    roomCode: string,
    playerName: string,
    avatar: string
  ): Promise<Room> {
    const userId = getStoredUserId() || generateUserId()
    storeUserId(userId)
    myPlayerId.value = userId

    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .eq('status', 'waiting')

    if (error || !rooms || rooms.length === 0) {
      throw new Error('房间不存在或已开始游戏')
    }

    const room = rooms[0] as Room

    const { data: players } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', room.id)

    if (players && players.length >= room.max_players) {
      throw new Error('房间已满')
    }

    currentRoom.value = room
    const seatIndex = players ? players.length : 0

    // 先订阅，再加入
    subscribeToRoom(room.id)
    await joinRoomInternal(room.id, userId, playerName, avatar, seatIndex)

    return room
  }

  /** 内部：加入房间 */
  async function joinRoomInternal(
    roomId: string,
    userId: string,
    name: string,
    avatar: string,
    seatIndex: number
  ) {
    const { data: insertedPlayer, error } = await supabase
      .from('room_players')
      .insert({
        room_id: roomId,
        user_id: userId,
        name: name,
        avatar: avatar,
        seat_index: seatIndex,
        is_ready: false,
      })
      .select()
      .single()

    if (error) {
      throw new Error('加入房间失败: ' + error.message)
    }

    mySeatIndex.value = seatIndex

    if (insertedPlayer && !roomPlayers.value.find(p => p.id === insertedPlayer.id)) {
      roomPlayers.value = [...roomPlayers.value, insertedPlayer as RoomPlayer]
    }
  }

  /** 准备/取消准备 */
  async function toggleReady() {
    if (!currentRoom.value || !myPlayerId.value) return

    const player = roomPlayers.value.find(p => p.user_id === myPlayerId.value)
    if (!player) return

    const { error } = await supabase
      .from('room_players')
      .update({ is_ready: !player.is_ready })
      .eq('id', player.id)

    if (error) console.error('切换准备状态失败:', error)
  }

  /** 开始游戏（仅房主） */
  async function startGame() {
    if (!canStart.value || !currentRoom.value) return

    const deckSeed = Math.random().toString(36).substring(2)

    // 先写入 game_snapshots，确保种子在 rooms 状态变更前已保存
    const { error: snapError } = await supabase.from('game_snapshots').insert({
      room_id: currentRoom.value.id,
      player_index: -1,
      game_state_json: JSON.stringify({ phase: 'playing', currentPlayerIndex: 0, deckSeed, roomId: currentRoom.value.id }),
    })
    if (snapError) {
      console.error('保存游戏快照失败:', snapError)
      return
    }

    const { error } = await supabase
      .from('rooms')
      .update({ status: 'playing' })
      .eq('id', currentRoom.value.id)

    if (error) {
      console.error('开始游戏失败:', error)
      return
    }
  }

  /** 离开房间 */
  async function leaveRoom() {
    if (!currentRoom.value || !myPlayerId.value) return

    await supabase
      .from('room_players')
      .delete()
      .eq('room_id', currentRoom.value.id)
      .eq('user_id', myPlayerId.value)

    if (isHost.value && roomPlayers.value.length > 1) {
      const nextHost = roomPlayers.value.find(p => p.user_id !== myPlayerId.value)
      if (nextHost) {
        await supabase.from('rooms').update({ host_id: nextHost.user_id }).eq('id', currentRoom.value.id)
      }
    }

    const { data: remaining } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', currentRoom.value.id)

    if (!remaining || remaining.length === 0) {
      await supabase.from('rooms').delete().eq('id', currentRoom.value.id)
    }

    unsubscribe()
    currentRoom.value = null
    roomPlayers.value = []
    myPlayerId.value = ''
    mySeatIndex.value = -1
    clearStoredUserId()
  }

  // ========== 实时订阅 + 轮询兜底 ==========

  function subscribeToRoom(roomId: string) {
    unsubscribe()

    // 频道1：rooms 表
    roomChannel = supabase.channel(`room:${roomId}`)
    roomChannel.on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}`,
    }, (payload) => {
      const updated = payload.new as Room
      console.log('[RT] room UPDATE:', updated.status)
      if (updated && currentRoom.value) {
        currentRoom.value = { ...currentRoom.value, status: updated.status, host_id: updated.host_id }
      }
    })
    roomChannel.subscribe((status, err) => {
      console.log('[RT] roomChannel:', status, err?.message || '')
    })

    // 频道2：room_players 表
    playersChannel = supabase.channel(`players:${roomId}`)
    playersChannel.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}`,
    }, (payload) => {
      const p = payload.new as RoomPlayer
      console.log('[RT] player INSERT:', p.name)
      if (!roomPlayers.value.find(x => x.id === p.id)) {
        roomPlayers.value = [...roomPlayers.value, p]
      }
    })
    playersChannel.on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}`,
    }, (payload) => {
      const p = payload.new as RoomPlayer
      const idx = roomPlayers.value.findIndex(x => x.id === p.id)
      if (idx !== -1) {
        const list = [...roomPlayers.value]
        list[idx] = p
        roomPlayers.value = list
      }
    })
    playersChannel.on('postgres_changes', {
      event: 'DELETE', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}`,
    }, (payload) => {
      const p = payload.old as RoomPlayer
      roomPlayers.value = roomPlayers.value.filter(x => x.id !== p.id)
    })
    playersChannel.subscribe((status, err) => {
      console.log('[RT] playersChannel:', status, err?.message || '')
    })

    // 频道3：game_moves 表
    movesChannel = supabase.channel(`moves:${roomId}`)
    movesChannel.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'game_moves', filter: `room_id=eq.${roomId}`,
    }, (payload) => {
      const move = payload.new as GameMove
      // 所有 move 都加入，包括自己的（用于统一驱动状态变更）
      gameMoves.value = [...gameMoves.value, move]
    })
    movesChannel.subscribe((status, err) => {
      console.log('[RT] movesChannel:', status, err?.message || '')
    })

    // 初始加载
    loadRoomPlayers(roomId)
    loadRoomState(roomId)

    // 轮询兜底：每2秒刷新
    pollTimer = setInterval(() => {
      if (currentRoom.value) {
        loadRoomPlayers(currentRoom.value.id)
        loadRoomState(currentRoom.value.id)
      }
    }, 2000)
  }

  function unsubscribe() {
    if (roomChannel) { supabase.removeChannel(roomChannel); roomChannel = null }
    if (playersChannel) { supabase.removeChannel(playersChannel); playersChannel = null }
    if (movesChannel) { supabase.removeChannel(movesChannel); movesChannel = null }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  async function loadRoomPlayers(roomId: string) {
    const { data, error } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat_index', { ascending: true })

    if (error) {
      console.error('[Poll] 加载玩家失败:', error.message)
      return
    }

    const newData = data || []

    // 恢复座位号
    if (myPlayerId.value && mySeatIndex.value === -1) {
      const me = newData.find((p: any) => p.user_id === myPlayerId.value)
      if (me) mySeatIndex.value = me.seat_index
    }

    roomPlayers.value = newData
  }

  async function loadRoomState(roomId: string) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error || !data) {
      console.error('[Poll] 加载房间失败:', error?.message)
      return
    }

    if (!currentRoom.value) {
      currentRoom.value = data as Room
      const storedId = getStoredUserId()
      if (storedId) myPlayerId.value = storedId
    } else if (currentRoom.value.status !== data.status || currentRoom.value.host_id !== data.host_id) {
      currentRoom.value = { ...currentRoom.value, status: data.status, host_id: data.host_id }
    }
  }

  async function loadLatestSnapshot(roomId: string): Promise<{ deckSeed: string | null; error: any }> {
    const result = await supabase
      .from('game_snapshots')
      .select('game_state_json')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (result.data?.game_state_json) {
      try {
        const parsed = JSON.parse(result.data.game_state_json)
        return { deckSeed: parsed.deckSeed || null, error: null }
      } catch {
        return { deckSeed: null, error: null }
      }
    }
    return { deckSeed: null, error: result.error }
  }

  // ========== 游戏动作同步 ==========

  async function sendMove(
    moveType: GameMove['move_type'],
    cardId?: string,
    pairIndex?: number,
    acceptedReset?: boolean
  ) {
    if (!currentRoom.value) return
    const { error } = await supabase.from('game_moves').insert({
      room_id: currentRoom.value.id,
      player_index: mySeatIndex.value,
      move_type: moveType,
      card_id: cardId,
      pair_index: pairIndex,
      accepted_reset: acceptedReset,
    })
    if (error) console.error('发送动作失败:', error)
  }

  async function saveSnapshot(gameState: GameState) {
    if (!currentRoom.value) return
    await supabase.from('game_snapshots').insert({
      room_id: currentRoom.value.id,
      player_index: gameState.turnManager.currentPlayer,
      game_state_json: JSON.stringify({
        phase: gameState.phase,
        currentPlayer: gameState.turnManager.currentPlayer,
        players: gameState.players.map(p => ({
          id: p.id,
          handCount: p.hand.length,
          collectedCount: p.collected.length,
          score: p.score,
        })),
        tableCardsCount: gameState.tableCards.length,
        deckRemaining: gameState.deck.remaining,
      }),
    })
  }

  return {
    currentRoom, roomPlayers, myPlayerId, mySeatIndex,
    gameMoves, isSyncing, connectionError,
    isHost, isInRoom, sortedPlayers, allReady, canStart,
    createRoom, joinRoomByCode, toggleReady, startGame, leaveRoom,
    sendMove, saveSnapshot, unsubscribe, subscribeToRoom,
    loadRoomPlayers, loadRoomState, loadLatestSnapshot,
  }
})
