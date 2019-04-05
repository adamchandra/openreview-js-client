

export function pp(a: any): string {
  return JSON.stringify(a, undefined, 2);
}

export function range(val: string): [number, number] {
  const [start, len] = val.split('-').map(Number);
  return [start, len];
}

// function asFile(s: string): string {
//   return path.normalize(s);
// }
