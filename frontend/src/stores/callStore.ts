import { create } from 'zustand'
import { wsManager } from '../lib/websocket'

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected'
export type CallType = 'audio' | 'video'

interface CallStoreState {
  callState: CallState
  callType: CallType
  remoteUserId: string | null
  remoteUserName: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  peerConnection: RTCPeerConnection | null
  isMuted: boolean
  isVideoOff: boolean

  startCall: (targetId: string, targetName: string, type: CallType) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
  handleIncoming: (data: any) => void
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

let pendingOffer: any = null
let pendingIceCandidates: any[] = []

function getCallerName(): string {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) return JSON.parse(userStr).full_name || 'User'
  } catch {}
  return 'User'
}

async function applyPendingCandidates(pc: RTCPeerConnection) {
  for (const candidate of pendingIceCandidates) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.warn('Failed to add queued ICE candidate:', err)
    }
  }
  pendingIceCandidates = []
}

function createPeerConnection(
  targetId: string,
  onRemoteStream: (stream: MediaStream) => void,
): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

  const remoteStream = new MediaStream()

  pc.ontrack = (e) => {
    e.streams[0]?.getTracks().forEach((t) => {
      if (!remoteStream.getTracks().find((rt) => rt.id === t.id)) {
        remoteStream.addTrack(t)
      }
    })
    onRemoteStream(remoteStream)
  }

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      wsManager.send({
        type: 'ice_candidate',
        target_id: targetId,
        candidate: { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex },
      })
    }
  }

  pc.onconnectionstatechange = () => {
    console.log('Connection state:', pc.connectionState)
    if (pc.connectionState === 'connected') {
      useCallStore.setState({ callState: 'connected' })
    }
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      useCallStore.getState().endCall()
    }
  }

  pc.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', pc.iceConnectionState)
  }

  return pc
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  callState: 'idle',
  callType: 'audio',
  remoteUserId: null,
  remoteUserName: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isMuted: false,
  isVideoOff: false,

  startCall: async (targetId, targetName, type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      })

      const pc = createPeerConnection(targetId, (rs) => set({ remoteStream: rs }))
      stream.getTracks().forEach((t) => pc.addTrack(t, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      wsManager.send({
        type: 'call_offer',
        target_id: targetId,
        offer: { type: offer.type, sdp: offer.sdp },
        call_type: type,
        from_name: getCallerName(),
      })

      set({
        callState: 'calling',
        callType: type,
        remoteUserId: targetId,
        remoteUserName: targetName,
        localStream: stream,
        peerConnection: pc,
      })
    } catch (err) {
      console.error('Failed to start call:', err)
      alert('Could not access camera/microphone')
    }
  },

  acceptCall: async () => {
    const { remoteUserId, callType } = get()
    if (!remoteUserId || !pendingOffer) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      })

      const pc = createPeerConnection(remoteUserId, (rs) => set({ remoteStream: rs }))
      stream.getTracks().forEach((t) => pc.addTrack(t, stream))

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer))

      // Apply any ICE candidates that arrived while we were ringing
      await applyPendingCandidates(pc)

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      wsManager.send({
        type: 'call_answer',
        target_id: remoteUserId,
        answer: { type: answer.type, sdp: answer.sdp },
      })

      pendingOffer = null
      set({
        callState: 'connected',
        localStream: stream,
        peerConnection: pc,
      })
    } catch (err) {
      console.error('Failed to accept call:', err)
      get().rejectCall()
    }
  },

  rejectCall: () => {
    const { remoteUserId } = get()
    if (remoteUserId) {
      wsManager.send({ type: 'call_reject', target_id: remoteUserId })
    }
    pendingOffer = null
    pendingIceCandidates = []
    set({ callState: 'idle', remoteUserId: null, remoteUserName: null })
  },

  endCall: () => {
    const { peerConnection, localStream, remoteUserId } = get()
    if (remoteUserId) {
      wsManager.send({ type: 'call_end', target_id: remoteUserId })
    }
    localStream?.getTracks().forEach((t) => t.stop())
    peerConnection?.close()
    pendingOffer = null
    pendingIceCandidates = []
    set({
      callState: 'idle',
      remoteUserId: null,
      remoteUserName: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isVideoOff: false,
    })
  },

  toggleMute: () => {
    const { localStream, isMuted } = get()
    localStream?.getAudioTracks().forEach((t) => { t.enabled = isMuted })
    set({ isMuted: !isMuted })
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get()
    localStream?.getVideoTracks().forEach((t) => { t.enabled = isVideoOff })
    set({ isVideoOff: !isVideoOff })
  },

  handleIncoming: (data) => {
    const { peerConnection } = get()
    console.log('[CALL] incoming:', data.type, data)

    if (data.type === 'call_offer') {
      pendingOffer = data.offer
      pendingIceCandidates = []
      set({
        callState: 'ringing',
        callType: data.call_type || 'audio',
        remoteUserId: data.from_id,
        remoteUserName: data.from_name || 'Unknown',
      })
    }

    if (data.type === 'call_answer') {
      if (!peerConnection) { console.error('[CALL] No peerConnection for call_answer!'); return }
      console.log('[CALL] Setting remote description from answer')
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
        .then(() => {
          console.log('[CALL] Connected!')
          set({ callState: 'connected' })
          // Apply any queued ICE candidates from the answerer
          applyPendingCandidates(peerConnection)
        })
        .catch((err) => console.error('Failed to set remote description:', err))
    }

    if (data.type === 'ice_candidate') {
      if (peerConnection && peerConnection.remoteDescription) {
        // PC is ready, apply immediately
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch((err) => console.warn('Failed to add ICE candidate:', err))
      } else {
        // PC not ready yet, queue it
        pendingIceCandidates.push(data.candidate)
      }
    }

    if (data.type === 'call_end' || data.type === 'call_reject') {
      const { localStream, peerConnection: pc } = get()
      localStream?.getTracks().forEach((t) => t.stop())
      pc?.close()
      pendingOffer = null
      pendingIceCandidates = []
      set({
        callState: 'idle',
        remoteUserId: null,
        remoteUserName: null,
        localStream: null,
        remoteStream: null,
        peerConnection: null,
        isMuted: false,
        isVideoOff: false,
      })
    }
  },
}))
