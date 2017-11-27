const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ATCPresale = artifacts.require("ATCPresale.sol");
const ATC = artifacts.require("ATC.sol");
const RefundVault = artifacts.require("vault/RefundVault.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");
const KYC = artifacts.require("kyc/KYC.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("[accounts]");
  accounts.forEach((account, i) => console.log(`[${ i }]  ${ account }`));

  try {
    let tokenFactory, presale, token, vault, kyc;
    let startTime, endTime;
    let rate, publicRate;
    let maxEtherCap;
    let vaultOwners;

    if (network === "mainnet") {
      startTime = moment.utc("2017-12-06").unix();
      endTime = moment.utc("2017-12-10").unix();
      maxEtherCap = 286000 * 10 ** 18;
      rate = 1950;
      publicRate = 1875;
    } else {
    //   startTime = moment().add(10, "minutes").unix();
    //   endTime = moment().add(25, "minutes").unix();
    //   maxEtherCap = 1 * 10 ** 18;
    //   rate = 1950;
    //   publicRate = 1875;
    //
    //   vaultOwners = accounts.slice(7, 7 + 10);
    // }
    //
    // tokenFactory = await MiniMeTokenFactory.new();
    // console.log("tokenFactory deployed at", tokenFactory.address);
    //
    // token = await ATC.new(tokenFactory.address);
    // console.log("token deployed at", token.address);
    //
    // vault = await RefundVault.new(vaultOwners);
    // console.log("vault deployed at", vault.address);
    //
    // kyc = await KYC.new();
    // console.log("kyc deployed at", kyc.address);
    //
    // /*eslint-disable */
    // presale = await ATCPresale.new(
    //   token.address,
    //   vault.address,
    //   kyc.address,
    //   startTime,
    //   endTime,
    //   maxEtherCap,
    //   rate,
    //   publicRate
    // );
    // /*eslint-enable */
    // console.log("presale deployed at", presale.address);
    //
    // await token.changeController(presale.address);
    // await vault.transferOwnership(presale.address);
    //
    // fs.writeFileSync(path.join(__dirname, "../addresses.json"), JSON.stringify({
    //   token: token.address,
    //   vault: vault.address,
    //   presale: presale.address,
    // }, undefined, 2));
  } catch (e) {
    console.error(e);
  }
};
