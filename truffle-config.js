require("babel-register");
require("babel-polyfill");

// SNT
const HDWalletProvider = require("truffle-hdwallet-provider");
require("dotenv").config();

const mnemonic = process.env.MNEMONIC || "onther certon onther certon onther certon onther certon onther certon onther certon ";
const providerUrl = "https://ropsten.infura.io";

const providerRopsten = new HDWalletProvider(mnemonic, providerUrl, 0);

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 4500000,
    },
    ropsten: {
      network_id: 3,
      provider: providerRopsten,
      gas: 4500000,
      // gasPrice: 20e9,
    },
    mainnet: {
      host: "onther.io",
      port: 60001,
      network_id: "1",
      from: "0x07bfd26f09a90564fbc72f77758b0259b65b783b",
      gas: 4500000,
      gasPrice: 25e9,
    },
  },
};
