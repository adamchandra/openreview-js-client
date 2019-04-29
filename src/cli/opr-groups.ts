// import _ from "lodash";

import { listGroups } from "../api/groups";

import { program, enqueueCommand } from ".";


program
  .command("groups list", "").alias("gl")
  .action((a, o, l) => {
    // enqueueCommand(a, o, l, () => console.log("groups: list"));
    enqueueCommand(a, o, l, listGroups);
  });

program
  .command("groups find", "").alias("gf")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, () => console.log("groups: find"));
  });

// groups.listGroups();



  // .argument("[user]", "login specified user", /.*/, "OpenReview.net")
