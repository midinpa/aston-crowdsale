require("babel-register");
require("babel-polyfill");
require("./setup");

// SNT
const HDWalletProvider = require("truffle-hdwallet-provider");
require("dotenv").config();

const mnemonic = process.env.MNEMONIC || "onther certon onther certon onther certon onther certon onther certon onther certon ";
const providerUrl = "https://ropsten.infura.io";

const providerRopsten = new HDWalletProvider(mnemonic, providerUrl, 0, 50);

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 4500000,
      gasPrice: 20e9,
    },
    ganache: {
      host: "localhost",
      port: 7545,
      network_id: "*",
      gas: 4500000,
    },
    ropsten: {
      network_id: 3,
      provider: providerRopsten,
      gas: 4500000,
      // gasPrice: 25e9,
    },
    mainnet: {
      host: "onther.io",
      port: 60001,
      network_id: "1",
      from: "e",
      gas: 4500000,
      gasPrice: 25e9,
    },
    parity: {
      host: "onther.io",
      port: 60009,
      network_id: "1",
      from: "0x266085436a4d9cb25603a3b1ab72338f313d7377",
      gas: 4500000,
      gasPrice: 60e9,
    },
  },
};
