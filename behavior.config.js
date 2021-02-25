const createAction = require('./src/lib/actions/createAction');
const cleanAction = require('./src/lib/actions/cleanAction');
const chalk = require('chalk')

module.exports = {
    'create': {
        command: 'create [<app-name>]',
        description: `${chalk.blue('create an application')}`,
        options: [
            ['-f, --force', 'overwrite project'], 
            ['-t --type <type>', 'your template type', 'ts']
        ],
        action: createAction
    },
    'clean': {
        command: 'clean',
        description:`${chalk.blue('clean your cached templates')}` ,
        options: [
            ['-t --template <template>', 'clean template name']
        ],
        action: cleanAction
    }
}