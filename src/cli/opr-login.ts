
import fs from "fs-extra";
import * as inquirer from "inquirer";
import { program, enqueueCommand } from ".";
import { prettyPrint } from "../lib/utils";

import _ from "lodash";

import {
  Answers,
} from "inquirer";

import {
  postLogin, Credentials,
} from "../api/login";

import { RunState } from "./state";

export interface UserPassword {
  id: string;
  password: string;
}

export interface ActiveCredentials {
  credentials: Credentials[];
  defaultLogin?: string;
}

program
  .command("login", "login to server")
  .argument("[user]", "login specified user", /.*/, "OpenReview.net")
  .action((a, o, l) => {
    enqueueCommand(a, o, l, doLogin);
  })
;

export async function doLogin(runState: RunState): Promise<void> {
  const userPass = await askUserPass();
  const log = runState.logger!;

  return postLogin(userPass.id, userPass.password)
    .then (creds => {
      writeCreds(creds);

      runState.credentials = creds;
    })
    .catch( (err: any) => {
      log.info("login err: " + err.response.data.message);
      log.info("retrying...");
      return doLogin(runState);
    })
  ;
}

export async function askUserPass(): Promise<UserPassword> {
  const prompt = inquirer.createPromptModule();
  const query = prompt([
    {
      type: "input",
      message: "Enter your user id",
      name: "user",
      default: "OpenReview.net"
    },
    {
      type: "password",
      message: "Enter your password",
      mask: "*",
      name: "password"
    }
  ]);

  return query
    .then((answers: Answers)  => {
      const id = answers.user;
      const password = answers.password;
      return { id, password };
    })
  ;
}

const credentialsFilename = "./user-credentials.json";

export function writeCreds(creds: Credentials): void {
  let activeCredentials: ActiveCredentials = {
    credentials: []
  };
  if (fs.existsSync(credentialsFilename)) {
    activeCredentials = fs.readJsonSync(credentialsFilename);
  }

  _.remove(activeCredentials.credentials, creds.user.id);
  activeCredentials.credentials.push(creds);
  activeCredentials.defaultLogin = creds.user.id;

  fs.writeJsonSync(credentialsFilename, activeCredentials);
}


export async function resumeAsUser(runState: RunState): Promise<void> {
  if (fs.existsSync(credentialsFilename)) {
    const activeCredentials: ActiveCredentials = fs.readJsonSync(credentialsFilename);
    // console.log(`resumeAsUser(): ${prettyPrint(activeCredentials)}`);
    const activeUser = activeCredentials.defaultLogin!;
    const activeCreds = _.find(activeCredentials.credentials, (c) => c.user.id === activeUser);
    runState.credentials = activeCreds;
  }
  return Promise.resolve();
}
