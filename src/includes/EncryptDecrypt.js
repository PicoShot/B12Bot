function xor(input, key = process.env.SECRET_KEY) {
    let result = [];
    for (let i = 0; i < input.length; i++) {
        result.push(String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length)));
    }
    return result.join('');
}

module.exports = {
    xor,
};
