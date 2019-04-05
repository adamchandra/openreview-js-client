import opts from 'commander';
import * as _ from 'lodash';
import path from "path";
// import fs from "fs-extra";

import { readCorpusEntries } from './corpusRoutes';

function pp(a: any): string {
  return JSON.stringify(a, undefined, 2);
}

function range(val: string): [number, number] {
  const [start, len] = val.split('..').map(Number);
  return [start, len];
}

function asFile(s: string): string {
  return path.normalize(s);
}

opts
  .command('list')
  .option('-c, --corpus <path>', 'corpus root path', asFile)
  .option('-r, --range <rbegin>..<rend>', 'listing offsets', range)
  .action((cmd: any) => {
    const [rbegin, rend] = cmd.range;
    const corpusRoot = cmd.corpus;

    console.log(`listCorpusEntries ${rbegin} - ${rend}`);

    const entries = readCorpusEntries(corpusRoot, rbegin, rend);
    console.log(pp(entries));
  })
;

opts
  .command('split')
  .action((cmd) => {
    console.log('split', cmd);

  })
;

// const corpusRoot =  opts.corpus;

opts.parse(process.argv);
