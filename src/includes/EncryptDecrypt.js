const crypto = require('crypto');

function xor(input, key = process.env.SECRET_KEY) {
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

module.exports = {
    xor,
    picoEncrypt,
    picoDecrypt
};
