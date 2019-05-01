//

import { program, enqueueCommand } from ".";

program
  .command("db reset", "reset database to named snapshot")
  .argument("[snapshot]", "path to mongodb snapshot file")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, resetDatabase);
  })
;

async function resetDatabase(runState: RunState): Promise<void> {

}
