const fs = require('fs');
const {CACHE_PATH} = require('../../assets/index.js');
const path = require('path');
const chalk = require('chalk');

module.exports = function (args) {
    const {template} = args;
    if(!fs.existsSync(CACHE_PATH)) {
        console.log(halk.pink(`no cache need to clean`));
        return -1;
    }

    if(template) {
        const cachedFiles = fs.readdirSync(CACHE_PATH);
        cachedFiles.forEach(filename => {
            if(!filename.startsWith(template)){
                return;
            }
            const absPath = path.join(CACHE_PATH, filename);
            fs.rmdirSync(absPath, {recursive: true});
            
        })
    }

    fs.rmdirSync(CACHE_PATH, {recursive: true});
}