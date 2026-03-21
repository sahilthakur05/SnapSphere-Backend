

const createError= (statusCode,message)=>{
    const error = new Error(message)
    error.statusCode = statusCode
    error.success = false
    return error
}
module.exports = createError