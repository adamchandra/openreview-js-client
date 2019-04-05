import cmds from 'commander';
import _ from 'lodash';

cmds.command('info', 'show system information');

cmds.parse(process.argv);
