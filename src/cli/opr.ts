import _ from "lodash";

import { doLogin } from "./opr-login";


import { program, enqueueCommand, runCommands } from ".";

import "./opr-groups";

import { RunState } from "./state";



export function debugLog(state: RunState): void {
  const { logger, args, options } = state;
  logger!.info(`echo: ${JSON.stringify(args)}, ${JSON.stringify(options)}`);
}

program
  .command("echo", "echo a string")
  .argument("<message>", "message to echo")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, debugLog);
  })
;

program
  .command("login", "login to server")
  .argument("[user]", "login specified user", /.*/, "OpenReview.net")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, doLogin);
  })
;


runCommands();
