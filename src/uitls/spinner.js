const {sleep} = require('./sleep');
const chalk = require('chalk');
const ora = require('ora')

module.exports = class Spinner {
    /**
     * 
     * @param {function} activeFn what to do;
     * @param {{message: string, retry: boolean, interval: number, retryCount: number, failMessage: string, succeedMessage: string, failCallback: function}} options 
     */
    constructor(activeFn, options) {
        const {
            message = '',
            retry = true,
            interval = 3000,
            retryCount = 3,
            failMessage,
            succeedMessage,
            failCallback
        } = options;

        this._activeFn = activeFn || (() => {})
        this._spinner = ora(message);
        this._retry = retry;
        this._currentRetryCount = 0;
        this._interval = interval;
        this._retryCount = retryCount;
        this._succeedMessage = succeedMessage || 'success';
        this._failMessage = failMessage || 'fail';
        this._failCallback = failCallback;
    }

    async run() {
        let result;
        this._spinner.start();
        try{
            result = await this._activeFn();
            this._spinner.succeed(this._succeedMessage);
            return result;
        }catch(e){
            console.log(e);
            this._spinner.fail(this._failMessage + ', retrying......');
            if(this._retry && this._currentRetryCount < this._retryCount){
                this._currentRetryCount++;
                await sleep(this._interval);
                await this.run();
            }else{
                console.log(`${chalk.red(this._failMessage)}`)
                if(this._failCallback) {
                    this._failCallback(e);
                }
            }
        }finally{
            this._currentRetryCount = 0;
        }

        return result;
    }
}