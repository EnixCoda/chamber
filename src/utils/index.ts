export function getColor(str: string | number) {
  let v = Math.abs(Number(str)) + 3;
  while (v < 0xffffff) {
    v *= v;
  }
  return "#" + (v & 0xffffff).toString(16);
}
