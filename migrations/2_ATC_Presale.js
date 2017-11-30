const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ATCPresale = artifacts.require("ATCPresale.sol");
const ATC = artifacts.require("ATC.sol");
const RefundVault = artifacts.require("vault/RefundVault.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

const migration_src = require("../argv.js");


module.exports = async function (deployer, network, accounts) {
  console.log("[accounts]");
  accounts.forEach((account, i) => console.log(`[${ i }]  ${ account }`));
  if (migration_src == "2") {
    try {
      let tokenFactory, token, vault, presale;

      let presaleStartTime, presaleEndTime;
      let presaleMaxEtherCap;
      let presaleRate
      let vaultOwners;

      presaleStartTime = moment().add(10, "minutes").unix();
      presaleEndTime = moment().add(25, "minutes").unix();
      presaleMaxEtherCap = 1 * 10 ** 18;
      presaleRate = 1950;

      // vaultOwners = accounts.slice(7, 7 + 10);
      vaultOwners = [
        "0x8afe4672155b070e0645c0c9fc50d8eb3eab9a7e",
        "0x9a324ed04eb457e28500a536ab9201516b1c69c5",
        "0x8f69ff5faad3b8b9df879455e2464538be283ada",
        "0x3caed6dfde5517aaf243a83086500d4416bef90c",
        "0x6a082e9f8b2126d964c4c4be2fc730e6a2a2574e",
        "0xf4a88b13eadd4fd2b7636470d597e638a369dafb",
        "0xd9e1ccf606e6dae608d94535c1753fde9c822642",
        "0x501cbf0f9281f60062639daabd3dedf40c527d4f",
        "0xbfd49a39dc77db83b4694526351e877e5b87ea27",
        "0xd8b556877210aaff9d864658391a02f894a2f47f"
      ];

      tokenFactory = await MiniMeTokenFactory.new();
      console.log("tokenFactory deployed at", tokenFactory.address);

      token = await ATC.new(tokenFactory.address);
      console.log("token deployed at", token.address);

      vault = await RefundVault.new(vaultOwners);
      console.log("vault deployed at", vault.address);

      /*eslint-disable */
      presale = await ATCPresale.new(
        token.address,
        vault.address,
        presaleStartTime,
        presaleEndTime,
        presaleMaxEtherCap,
        presaleRate
      );
      /* eslint-enable */
      console.log("presale deployed at", presale.address);

      await token.changeController(presale.address);
      await vault.transferOwnership(presale.address);

      fs.writeFileSync(path.join(__dirname, "../addresses.json"), JSON.stringify({
        token: token.address,
        vault: vault.address,
        presale: presale.address,
      }, undefined, 2));

    } catch (e) {
      console.error(e);
    }
  }
};
