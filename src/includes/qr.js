const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

function generateSecret() {
    const secret = speakeasy.generateSecret({ name: `B12Bot` });
    return secret;
}

function generateQRCode(secret) {
    return new Promise((resolve, reject) => {
        qrcode.toBuffer(secret.otpauth_url, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer);
            }
        });
    });
}

module.exports = {
    generateSecret,
    generateQRCode
};
