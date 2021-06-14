/// <reference types="react-scripts" />

interface RTCPeerConnection {
  setLocalDescription(description?: RTCSessionDescriptionInit): Promise<void>
  restartIce?(): void
}
