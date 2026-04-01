import { useEffect, useRef, useState } from 'react'
import { useCallStore } from '../../stores/callStore'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import Avatar from '../ui/Avatar'

export default function CallOverlay() {
  const {
    callState,
    callType,
    remoteUserName,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCallStore()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsed(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [callState])

  if (callState === 'idle') return null

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const isVideoCall = callType === 'video'
  const isConnectedVideo = isVideoCall && callState === 'connected'

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6">
      <div className={`bg-[#1a1a2e] rounded-3xl flex flex-col items-center overflow-hidden ${isConnectedVideo ? 'w-[85vw] max-w-[900px] h-[80vh] max-h-[700px]' : 'w-[400px]'}`}>

        {/* Video call - connected */}
        {isConnectedVideo && (
          <div className="relative w-full flex-1 bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Local video PIP */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-40 h-28 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
            />
            {/* Name + timer overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-3">
              <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">{remoteUserName}</span>
                <span className="text-white/60 text-xs">{fmt(elapsed)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Audio call or pre-connect states */}
        {!isConnectedVideo && (
          <div className="flex flex-col items-center gap-5 py-12 px-8">
            {/* Animated ring for calling/ringing */}
            <div className="relative">
              {(callState === 'calling' || callState === 'ringing') && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute -inset-3 rounded-full bg-primary-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                </>
              )}
              <div className="w-24 h-24 relative z-10">
                <Avatar name={remoteUserName || 'User'} size="xl" className="!w-24 !h-24 !text-3xl" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-xl font-semibold text-white">{remoteUserName || 'User'}</h3>
              <p className="text-sm text-white/50">
                {callState === 'calling' && (isVideoCall ? 'Video calling...' : 'Audio calling...')}
                {callState === 'ringing' && (isVideoCall ? 'Incoming video call...' : 'Incoming audio call...')}
                {callState === 'connected' && fmt(elapsed)}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={`flex items-center justify-center gap-5 py-6 px-8 w-full ${isConnectedVideo ? 'bg-black/50 backdrop-blur-sm' : ''}`}>
          {callState === 'ringing' ? (
            <>
              <button
                onClick={rejectCall}
                className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={acceptCall}
                className="w-14 h-14 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition shadow-lg shadow-primary-500/30"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              {isVideoCall && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={endCall}
                className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
