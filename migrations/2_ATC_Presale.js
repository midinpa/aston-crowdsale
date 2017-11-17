const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ATCPresale = artifacts.require("ATCPresale.sol");
const ATC = artifacts.require("ATC.sol");
const RefundVault = artifacts.require("crowdsale/RefundVault.sol");
const MultiSig = artifacts.require("wallet/MultiSigWallet.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("[accounts]");
  accounts.forEach((account, i) => console.log(`[${ i }]  ${ account }`));

  try {

    let maxEtherCap;
    let startTime, endTime;
    let reserveWallet;

    if (network === "mainnet") {
      maxEtherCap = 10000 * 10**18;
      startTime = moment.utc("2017-12-06").unix();
      endTime = moment.utc("2017-12-10").unix();
    } else {
      maxEtherCap = 1 * 10**18;
      startTime = moment().add(10, "minutes").unix();
      endTime = moment().add(20, "minutes").unix();

      reserveWallet = [
        "0xb7aa50eb5e42c74076ea1b902a6142539f654796",
        "0x922aa0d0e720caf10bcd7a02be187635a6f36ab0",
        "0x6267901dbb0055e12ea895fc768b68486d57dcf8",
      ];
    }

    const rate = 200;

    const multiSig = await MultiSig.new(reserveWallet, reserveWallet.length - 1)
    console.log("multiSig deployed at", multiSig.address);

    const tokenFactory = await MiniMeTokenFactory.new();
    console.log("tokenFactory deployed at", tokenFactory.address);

    const token = await ATC.new(tokenFactory.address);
    console.log("token deployed at", token.address);

    const vault = await RefundVault.new(multiSig.address, reserveWallet);
    console.log("vault deployed at", vault.address);

    /*eslint-disable */
    const presale = await ATCPresale.new(
      token.address,
      vault.address,
      reserveWallet,
      startTime,
      endTime,
      maxEtherCap,
      rate
    );
    /*eslint-enable */
    console.log("presale deployed at", presale.address);

    await token.changeController(presale.address);
    await vault.transferOwnership(presale.address);

    fs.writeFileSync(path.join(__dirname, "../addresses.json"), JSON.stringify({
      multiSig: multiSig.address,
      token: token.address,
      vault: vault.address,
      presale: presale.address,
    }, undefined, 2));
  } catch (e) {
    console.error(e);
  }
};
