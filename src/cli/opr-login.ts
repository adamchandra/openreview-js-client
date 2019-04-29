
import fs from "fs-extra";
import * as inquirer from "inquirer";

import {
  Answers,
  // Separator
} from "inquirer";

import {
  postLogin, Credentials,
  // Credentials
} from "../api/login";

import { RunState } from "./state";

export interface UserPassword {
  id: string;
  password: string;
}


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
  fs.writeJsonSync(credentialsFilename, creds);
}


export async function resumeAsUser(runState: RunState): Promise<void> {
  if (fs.existsSync(credentialsFilename)) {
    const creds = fs.readJsonSync(credentialsFilename);
    runState.credentials = creds;
  }
  return Promise.resolve();
}

// import {
//   // ChoiceType,
//   // Question,
//   // MessageType,
//   // QuestionType,
//   // SourceType,
//   // DateType,
//   // TimeType,
//   Answers,
//   Separator
// } from "inquirer";



// export function sep(s: string): any  {
//   return new Separator(s);
// }
// export function choice(s: string, opts: object = {}): any  {
//   return { name: s, ...opts };

  // it('demo checkboxes', function(done) {
  //   const prompt = inquirer.createPromptModule();
  //   const query = prompt([
  //     {
  //       type: "checkbox",
  //       message: "Select toppings",
  //       name: "toppings",
  //       choices: [
  //         sep("The usual:"),
  //         choice("Peperonni"),
  //         choice("Cheese", {checked: true}),
  //         choice("Mushroom"),
  //         sep("The extras:"),
  //         choice("Pineapple",),
  //         choice("Bacon"),
  //         choice("Olives", {disabled: "out of stock"}),
  //         choice("Extra cheese")
  //       ],
  //       validate: function(answers: Answers) {
  //         if ( answers.length < 1 ) {
  //           return "You must choose at least one topping.";
  //         }
  //         return true;
  //       }
  //     }
  //   ]);
  //                        // , function(answers: Answers) {

  //   query
  //     .then((answers: Answers)  => {
  //       console.log( JSON.stringify(answers, null, "  ") );
  //     })
  //     .then(()  => done())
  //   ;

  // });

  it('demo passwords', function(done) {
    const prompt = inquirer.createPromptModule();
    const query = prompt([
      {
        type: "password",
        message: "Enter your password",
        name: "password"
      }
    ], function(answers: inquirer.Answers) {
      console.log( JSON.stringify(answers, null, "  ") );
    });

    query
      .then((answers: Answers)  => {
        console.log( JSON.stringify(answers, null, "  ") );
      })
      .then(()  => done())
    ;

  });
