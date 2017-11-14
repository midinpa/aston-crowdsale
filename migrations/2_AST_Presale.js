const fs = require("fs");
const path = require("path");
const moment = require("moment");

const PresaleKYC = artifacts.require("KYC.sol");
const ASTPresale = artifacts.require("ASTPresale.sol");
const AST = artifacts.require("AST.sol");
const RefundVault = artifacts.require("crowdsale/RefundVault.sol");
const MultiSig = artifacts.require("wallet/MultiSigWallet.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("[accounts]");
  accounts.forEach((account, i) => console.log(`[${ i }]  ${ account }`));

  try {
    const maxEtherCap = 1000 * 10 ** 18;

    let startTime, endTime;
    if (network === "development") {
      startTime = moment().add(5, "minutes").unix();
      endTime = moment().add(20, "minutes").unix();
    } else {
      startTime = moment.utc("2017-12-06").unix();
      endTime = moment.utc("2017-12-10").unix();
    }

    const rate = 200;

    const reserveWallet = [
      "0x922aa0d0e720caf10bcd7a02be187635a6f36ab0",
      "0x6267901dbb0055e12ea895fc768b68486d57dcf8",
      "0x236df55249ac7a6dfea613cd69ccd014c3cb8445",
    ];

    const multiSig = await MultiSig.new(reserveWallet, reserveWallet.length - 1); // 2 out of 3
    console.log("multiSigs deployed at", multiSig.address);

    const token = await AST.new();
    console.log("token deployed at", token.address);

    const vault = await RefundVault.new(multiSig.address, reserveWallet);
    console.log("vault deployed at", vault.address);

    /*eslint-disable */
    const presale = await ASTPresale.new(
      token.address,
      vault.address,
      multiSig.address,
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
