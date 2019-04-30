//
import { Credentials } from '../api/login';
// import cap, { Caporal } from 'caporal';

export interface CaporalLogger {
  debug(str: string): void;
  info(str: string): void;
  log(str: string): void;
  warn(str: string): void;
  error(str: string): void;
}
export interface UserPassword {
  user: string;
  password: string;
}


export interface RunState {
  args?: object;
  options?: object;
  logger?: CaporalLogger;

  userPass?: UserPassword;
  credentials?: Credentials;
}


// export type ActionResult = PromiseLike<any | void> | any | void;
// export type ActionFunction = (s: RunState) => ActionResult;
export type ActionFunction<State> = (s: State) => Promise<void>;

export function initState(args: object, options: object, logger: CaporalLogger): ActionFunction<RunState> {
  return (state: RunState) => {
    return new Promise((resolve) => {
      state.args = args;
      state.options = options;
      state.logger = logger;
      resolve();
    });
  };
}
