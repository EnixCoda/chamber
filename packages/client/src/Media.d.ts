interface MediaDevices extends EventTarget {
  getDisplayMedia(constrains?: MediaStreamConstraints): Promise<MediaStream>
}
