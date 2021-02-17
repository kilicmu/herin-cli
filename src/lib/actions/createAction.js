const fs = require('fs')
const fsExtra = require('fs-extra');
const path = require('path')
const Inquirer = require('inquirer');
const axios = require('axios');
const util = require('util');
const ejs = require('ejs');
const chalk = require('chalk');

const downloadGitRepo = util.promisify(require('download-git-repo'));
const Spinner = require('../../uitls/spinner');
const {REPOS_URL, CACHE_PATH} = require('../../assets/index');


const renderObject = {
    name: ''
}

module.exports = async (name, argv) => {
    if(!name) {
        name = await askForProjectName();
    }
    initlizeRenderObject(name);
    let {type, force} = argv;
    const targetPath = path.join(process.cwd(), name);
    if(fs.existsSync(targetPath)) {
        if(!force){
            const {rewrite} = await Inquirer.prompt([
                {
                    name: 'rewrite',
                    type: 'confirm',
                    message: chalk.red(`project is already existed, would you like to rewrite it?`),
                    default: false
                }
            ])
            if(!rewrite){
                console.log(chalk.blue(`exist! bye~ ヽ(✿ﾟ▽ﾟ)ノ`))
                return;
            }
            fs.rmdirSync(targetPath, {recursive: true});
        } else{
            fs.rmdirSync(targetPath, {recursive: true});
        }
    }

    return await create(name, targetPath);
}

function initlizeRenderObject(name) {
    renderObject.name = name;
}

async function askForProjectName() {
    const {projectName} = await Inquirer.prompt([
            {
                name: 'projectName',
                type: 'input',
                message: 'input your project-name',
            }
    ]); 
    
    return projectName
}

async function create(projectName, targetPath) {
    const repo = await fetchRepo();
    const tag = await fetchTag(repo.tags_url);
    const template = await download(repo, tag, targetPath);
    printSuccessMessage(projectName);
    return template;
}

async function fetchRepo() {
    try{
        const fetchReposSpinner = new Spinner(()=> axios.get(REPOS_URL), {
            message: 'fetching repos.....',
            succeedMessage: 'fetched repo successed',
            failMessage: 'fetched repo fail',
            failCallback: (e) => process.exit(-1)
        })

        const {data: repos} = await fetchReposSpinner.run();
        const repoNames = repos.map(repo => repo.name);

        const { templateName } = await Inquirer.prompt([
            {
                name: 'templateName',
                type: 'list',
                message: 'choose a template',
                choices: repoNames.map(repoName => ({name: repoName, value: repoName}))
            }
        ]);
        return repos.filter(repo => (repo.name === templateName))[0];
    }catch(e){
        throw new Error('fetch repo false');
    }
}

async function fetchTag(url) {
    const fetchTagsSpinner = new Spinner(()=> axios.get(url), {
            message: 'fetching tags.....',
            succeedMessage: 'fetched tags successed',
            failMessage: 'fetched tags fail',
            failCallback: (e) => process.exit(-1)
        });

    const {data: tags} = await fetchTagsSpinner.run();
    if(tags.length === 0) {
        
        process.exit(-1);
    }
    const tagNames = tags.map(tag => tag.name);
    const { tagName } = await Inquirer.prompt([
            {
                name: 'tagName',
                type: 'list',
                message: 'choose a template',
                choices: tagNames.map(tagName => ({name: tagName, value: tagName}))
            }
    ]);
    return tagName;
}


async function download(repo, tag, targetPath) {
    if(!fs.existsSync(CACHE_PATH)) fs.mkdirSync(CACHE_PATH);

    const requestURL = `herin-cli/${repo.name}/${tag ? '#' + tag : ''}`; // /herin-cli/typescript-template#1.0.0
    const cachedTemplates = fs.readdirSync(CACHE_PATH);
    const cacheName = `${repo.name}${tag ? '@' + tag : ''}`; // typescript-template@1.0.0

    const downloadSpinner = new Spinner(()=> downloadGitRepo(requestURL, path.join(CACHE_PATH, cacheName)), {
        message: 'download template.....',
        succeedMessage: 'downloaded template successed',
        failMessage: 'downloaded template failed',
        failCallback: (e) => process.exit(-1)
    })

    try{
        if(!cachedTemplates.includes(cacheName)){
            await downloadSpinner.run();
        }
        const cachedTemplatePath = path.join(CACHE_PATH, cacheName);
        return await copyTemplate(cachedTemplatePath, targetPath);
    }catch(e){
        fs.rmdirSync(targetPath, {recursive: true});
        throw e;
    }
}

async function copyTemplate(fromPath, toPath) {
    const copySpinner = new Spinner(()=> fsExtra.copy(fromPath, toPath), {
        message: 'copying template.....',
        succeedMessage: 'copied template successed',
        failMessage: 'copied template failed',
        failCallback: (e) => process.exit(-1)
    })

    await copySpinner.run();
    return rewritePackageJson(path.join(fromPath, 'package.tmpl.json'), path.join(toPath, 'package.json'));
}

function rewritePackageJson(packageJsonPath, targetPath) {
    const packageJsonTmpl = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJsonFileContent = ejs.render(packageJsonTmpl, renderObject);
    fs.writeFileSync(targetPath, packageJsonFileContent, {
        encoding: 'utf8',
        mode: 0o666,
        flag: 'w'
    })
}



function printSuccessMessage(name) {
    console.log(chalk.green('=================================================='));
    console.log(chalk.green(`your project: ${chalk.cyan(name)} was created successfully! `));
    console.log(chalk.green(`run: `)); 
    console.log(chalk.green(`   cd ${name}`)); 
    console.log(chalk.green(`   yarn / npm install`)); 
    console.log(chalk.green('=================================================='))
}