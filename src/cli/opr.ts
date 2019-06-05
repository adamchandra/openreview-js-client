import _ from "lodash";


import { runCommands } from ".";

import "./opr-groups";
import "./opr-login";
import "./opr-db";

// program
//   .command("echo", "echo a string")
//   .argument("<message>", "message to echo")
//   .action((a, o, l) => {
//     enqueueCommand(a, o, l, debugLog);
//   })
// ;


runCommands();
