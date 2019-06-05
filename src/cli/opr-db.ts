//

import { program, enqueueCommand } from ".";
import { RunState } from "./state";
import { prettyPrint } from "../lib/utils";

program
  .command("db reset", "reset database to named snapshot")
  .argument("[snapshot]", "path to mongodb snapshot file")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, resetDatabase);
  })
;

async function resetDatabase(runState: RunState): Promise<void> {
  const log = runState.logger!;
  const args = runState.args!;
  log.info(`resetDatabase ${prettyPrint(args)}`);
}
