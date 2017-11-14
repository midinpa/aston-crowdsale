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
    const maxEtherCap = 100000 * 10 ** 18;

    const startTime = moment.utc("2017-09-26").unix();
    const endTime = moment.utc("2017-10-10").unix();

    const reserveWallet = [
      "0x822Bb1cdd2051323ABdb3D705E6d67F70c6F1516",
      "0x3a9DdA0eC79B6C38b650C56F4885C291551542a2",
      "0x528960b54D618A99683EbDcCd83Ed5da02616a45",
    ];

    const presaleKYC = await PresaleKYC.new();

    console.log("presaleKYC deployed at", presaleKYC.address);

    const multiSig = await MultiSig.new(reserveWallet, reserveWallet.length - 1); // 2 out of 3
    console.log("multiSigs deployed at", multiSig.address);

    const token = await AST.new();
    console.log("token deployed at", token.address);

    const vault = await RefundVault.new(multiSig.address, reserveWallet);
    console.log("vault deployed at", vault.address);

    /*eslint-disable */
    const presale = await ASTPresale.new(
      presaleKYC.address,
      token.address,
      vault.address,
      multiSig.address,
      reserveWallet,
      startTime,
      endTime,
      maxEtherCap,
    );
    /*eslint-enable */
    console.log("presale deployed at", presale.address);

    await token.changeController(presale.address);
    await vault.transferOwnership(presale.address);

    fs.writeFileSync(path.join(__dirname, "../addresses.json"), JSON.stringify({
      multiSig: multiSig.address,
      token: token.address,
      vault: vault.address,
      crowdsale: crowdsale.address,
    }, undefined, 2));
  } catch (e) {
    console.error(e);
  }
};
