

export function pp(a: any): string {
  return JSON.stringify(a, undefined, 2);
}

export function range(val: string): [number, number] {
  const [start, len] = val.split('-').map(Number);
  return [start, len];
}

// function asFile(s: string): string {
//   return path.normalize(s);
// }

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

  // it('demo passwords', function(done) {
  //   const prompt = inquirer.createPromptModule();
  //   const query = prompt([
  //     {
  //       type: "password",
  //       message: "Enter your password",
  //       name: "password"
  //     }
  //   ], function(answers: inquirer.Answers) {
  //     console.log( JSON.stringify(answers, null, "  ") );
  //   });

  //   query
  //     .then((answers: Answers)  => {
  //       console.log( JSON.stringify(answers, null, "  ") );
  //     })
  //     .then(()  => done())
  //   ;

  // });
