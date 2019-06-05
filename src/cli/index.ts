import cmds from "caporal";
export const program = cmds;

import _ from "lodash";

import {
  CaporalLogger,
  initState,
  ActionFunction as AF,
  RunState
} from "./state";


import { resumeAsUser } from "./opr-login";

export type ActionFunction = AF<RunState>;

const actions: ActionFunction[] = [ resumeAsUser ];


export function enqueueCommand(args: object, options: object, logger: CaporalLogger, command: ActionFunction): void {
  actions.push(initState(args, options, logger));
  actions.push(command);
}

export function runCommands(): void {

  program.parse(process.argv);

  const accum: RunState = {};

  const chain = _.chain(actions).reduce((acc, action) => {
    // console.log("current acc/action", acc, action);
    // console.log("current accum", accum);
    return acc.then(() => action(accum))
      .catch(err => {
        console.log("error: ", err);
      }) ;
  }, Promise.resolve());

  chain.value();
}
