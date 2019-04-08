import cmds from 'commander';
import _ from 'lodash';


// import sh from 'shelljs';
import fs from "fs-extra";
import { readCreds } from '../api/login';

// look for auth info
const authInfoFile = 'user-credentials.json';
// const statEntry = fs.statSync(authInfoFile);
const authInfoExists = fs.existsSync(authInfoFile);

if (!authInfoExists) {
  console.log('no auth info');

  cmds
    .command('info', 'show system information')
    .command('login', 'login to server')
  ;

  cmds.parse(process.argv);

} else {
  const userCreds = readCreds();
  console.log('authorized as:', userCreds.user.id);

  cmds
    .command('info', 'show system information')
    .command('groups', 'login to server')
  ;

  cmds.parse(process.argv);

}


console.log('/done, everything');
