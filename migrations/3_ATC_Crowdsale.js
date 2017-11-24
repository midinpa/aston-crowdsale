const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ATCPresale = artifacts.require("ATCPresale.sol");
const ATC = artifacts.require("ATC.sol");
const RefundVault = artifacts.require("vault/RefundVault.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

const ATCCrowdSale = artifacts.require("ATCCrowdSale.sol");
const KYC = artifacts.require("kyc/KYC.sol");
const ReserveLocker = artifacts.require("ReserveLocker.sol");
const TeamLocker = artifacts.require("TeamLocker.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("[accounts]");
  accounts.forEach((account, i) => console.log(`[${ i }]  ${ account }`));

  try {
    let maxEtherCap, minEtherCap;

    let firstPeriodStartTime, firstPeriodEndTime;

    let tokenFactory, token, vault, presale;
    let kyc, crowdsale;

    let bountyAddress;
    let partnersAddress;
    let vaultOwners;
    let ATCReserveLocker;
    let teamLocker;
    let ATCController;

    let ATCReserveBeneficiary;
    let teamBeneficiaries;
    let ATCReserveReleaseTime;
    let teamReleaseTimelines;

    if (network === "mainnet") {
      firstPeriodStartTime = moment.utc("2017-12-11").unix();
      firstPeriodEndTime = moment.utc("2017-12-17").unix();
      maxEtherCap = 286000 * 10 ** 18;
      minEtherCap = 28600 * 10 ** 18;
    } else {
      const presaleStartTime = moment().add(5, "minutes").unix();
      const presaleEndTime = moment().add(10, "minutes").unix();
      const presaleMaxEtherCap = 1 * 10 ** 18;
      const presaleRate = 1950;

      vaultOwners = accounts.slice(7, 7 + 10);

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

      // //////////////
      // PRESALE DONE//
      // //////////////

      firstPeriodStartTime = moment().add(15, "minutes").unix();
      firstPeriodEndTime = moment().add(30, "minutes").unix();
      maxEtherCap = 1 * 10 ** 18;
      minEtherCap = 5 * 10 ** 17;

      bountyAddress = "0xb7aa50eb5e42c74076ea1b902a6142539f654796";
      partnersAddress = "0xb7aa50eb5e42c74076ea1b902a6142539f654797";

      ATCReserveBeneficiary = "0xb7aa50eb5e42c74076ea1b902a6142539f654799";
      ATCReserveReleaseTime = moment().add(45, "minutes").unix();

      teamBeneficiaries = [
          "0xb7aa50eb5e42c74076ea1b902a6142539f654799",
          "0xb7aa50eb5e42c74076ea1b902a6142539f654798",
          "0xb7aa50eb5e42c74076ea1b902a6142539f654797"
      ];
      teamReleaseTimelines = [
        moment().add(40, "minutes").unix(),
        moment().add(45, "minutes").unix(),
      ];
      teamReleaseRatios = [
        20,
        50,
      ];

      // TODO: ATCPLACEHOLDER ?
      ATCController = "0xb7aa50eb5e42c74076ea1b902a6142539f654796";

      ATCReserveLocker = await ReserveLocker.new(
        token.address,
        ATCReserveBeneficiary,
        ATCReserveReleaseTime,
      );
      console.log("ATCReserveLocker deployed at", ATCReserveLocker.address);

      teamLocker = await TeamLocker.new(
        token.address,
        teamBeneficiaries,
        teamReleaseTimelines,
        teamReleaseRatios,
      );
      console.log("teamLocker deployed at", teamLocker.address);


      kyc = await KYC.new();
      console.log("kyc deployed at", kyc.address);

      /*eslint-disable */
      crowdsale = await ATCCrowdSale.new(
        kyc.address,
        token.address,
        vault.address,
        presale.address,
        bountyAddress,
        partnersAddress,
        ATCReserveLocker.address,
        teamLocker.address,
        ATCController,
        maxEtherCap,
        minEtherCap,
      );
      console.log("crowdsale deployed at", crowdsale.address);

      crowdsale.startPeriod(firstPeriodStartTime, firstPeriodEndTime);
    }// end else

    //AFTER PRESALE ENDTIME -> SEND TX (finalizePresale(CROWDSALE.ADDRESS))

    fs.writeFileSync(path.join(__dirname, "../addresses.json"), JSON.stringify({
      token: token.address,
      vault: vault.address,
      presale: presale.address,
    }, undefined, 2));
  } catch (e) {
    console.error(e);
  }
};
