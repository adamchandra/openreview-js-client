
import _ from "lodash";

import {
  listGroups,
  createGroup,
  // deleteGroup,
  showGroupTree,
  // GroupPermissions
} from "../api/groups";

import {
  logToConsole
} from "./output";

import { program, enqueueCommand } from ".";

import { RunState } from "../cli/state";

import * as inquirer from "inquirer";

import {
  Answers,
} from "inquirer";


export async function askGroupId(): Promise<string> {
  const prompt = inquirer.createPromptModule();
  const query = prompt([
    {
      type: "input",
      message: "Enter new group id",
      name: "id",
    }
  ]);

  return query.then((answers: Answers) => answers.id);
}

async function createGroupProg(runState: RunState): Promise<void> {
  // TODO discover group prefix using current group
  const groupId = await askGroupId();
  return createGroup(groupId, runState);
}

async function deleteGroupProg(runState: RunState): Promise<void> {
  // TODO maybe use current group
  const groupId = await askGroupId();

  return createGroup(groupId, runState);
}


program
  .command("groups list", "").alias("glist")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, listGroups);
  });

program
  .command("groups find", "").alias("gfind")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, logToConsole("groups: find"));
  });

program
  .command("groups create", "").alias("gcr")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, createGroupProg);
  });

program
  .command("groups delete", "").alias("gdel")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, deleteGroupProg);
  });

program
  .command("groups tree", "").alias("gtree")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, showGroupTree);
  });

program
  .command("groups show", "").alias("gshow")
  .action((a, o, l) => {
    // enqueueCommand(a, o, l, showGroupTree);
  });

// (this is a session test)
