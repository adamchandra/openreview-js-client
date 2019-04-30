//
import { RunState } from "./state";

// export function debugLog(s: string): (runState: RunState) => Promise<void> {
//   const { logger, args, options } = runState;
//   logger!.info(`echo: ${JSON.stringify(args)}, ${JSON.stringify(options)}`);
//   // return (_: RunState) => Promise.resolve();
//   return () => Promise.resolve();
// }
// export function debugLog(state: RunState): void {
//   const { logger, args, options } = state;
//   logger!.info(`echo: ${JSON.stringify(args)}, ${JSON.stringify(options)}`);
// }

export function logToConsole(s: string): (s: RunState) => Promise<void> {
  console.log(s);
  // return (_: RunState) => Promise.resolve();
  return () => Promise.resolve();
}
