const crypto = require('crypto');

// Welcome To Pico's Encrypt/Decrypt System!

function xor(input, key) {
    let result = [];
    for (let i = 0; i < input.length; i++) {
        result.push(String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length)));
    }
    return result.join('');
}

function base64Encode(input) {
    return Buffer.from(input, 'utf-8').toString('base64');
}

function base64Decode(input) {
    return Buffer.from(input, 'base64').toString('utf-8');
}

function substitutionEncrypt(input, shift = 5) {
    return input.split('').map(char => {
        const charCode = char.charCodeAt(0);
        return String.fromCharCode(charCode + shift);
    }).join('');
}

function substitutionDecrypt(input, shift = 5) {
    return input.split('').map(char => {
        const charCode = char.charCodeAt(0);
        return String.fromCharCode(charCode - shift);
    }).join('');
}

function picoEncrypt(input, key) {
    const xorEncrypted = xor(input, key);
    const base64Encoded = base64Encode(xorEncrypted);
    const finalEncrypted = substitutionEncrypt(base64Encoded);
    return finalEncrypted;
}

function picoDecrypt(input, key) {
    const substitutionDecrypted = substitutionDecrypt(input);
    const base64Decoded = base64Decode(substitutionDecrypted);
    const finalDecrypted = xor(base64Decoded, key);
    return finalDecrypted;
}

function md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}

module.exports = {
    xor,
    picoEncrypt,
    picoDecrypt,
    md5
};
