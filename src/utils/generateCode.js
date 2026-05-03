const { nanoid } = require("nanoid");

const generateCode = () => nanoid(6);

module.exports = generateCode;