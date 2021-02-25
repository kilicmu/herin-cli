const {SUPPORT_TEMPLATE_TYPES} = require("../assets/index.js");

const serializationType = (type) => {
    if(!SUPPORT_TEMPLATE_TYPES.includes(type)) {
        throw new Error('unsupport template type');
    }
    
    return type==='typescript' ? 'ts' : 'js'
}

module.exports.serializationType = serializationType;