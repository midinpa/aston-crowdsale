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

const migration_src = require("../argv.js");

module.exports = async function (deployer, network, accounts) {

  if (migration_src == "3") {
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

      let baseRate;
      let additionalBonusAmounts;

      let presale_address;
      let token_address;
      let vault_address;

      let additionalPeriodStartTime1, additionalPeriodEndTime1;
      let additionalPeriodStartTime2, additionalPeriodEndTime2;
      let additionalPeriodStartTime3, additionalPeriodEndTime3;
      let additionalPeriodStartTime4, additionalPeriodEndTime4;
      let additionalPeriodStartTime5, additionalPeriodEndTime5;
      let additionalPeriodStartTime6, additionalPeriodEndTime6;
      let additionalPeriodStartTime7, additionalPeriodEndTime7;


      firstPeriodStartTime = moment.utc("2017-12-11T03:00").unix();
      firstPeriodEndTime = moment.utc("2017-12-17T15:00").unix();

      additionalPeriodStartTime1 = moment.utc("2017-12-18T03:00").unix();
      additionalPeriodEndTime1 = moment.utc("2017-12-24T15:00").unix();

      additionalPeriodStartTime2 = moment.utc("2017-12-25T03:00").unix();
      additionalPeriodEndTime2 = moment.utc("2017-12-31T15:00").unix();

      additionalPeriodStartTime3 = moment.utc("2018-01-01T03:00").unix();
      additionalPeriodEndTime3 = moment.utc("2018-01-07T15:00").unix();

      additionalPeriodStartTime4 = moment.utc("2018-01-08T03:00").unix();
      additionalPeriodEndTime4 = moment.utc("2018-01-14T15:00").unix();

      additionalPeriodStartTime5 = moment.utc("2018-01-15T03:00").unix();
      additionalPeriodEndTime5 = moment.utc("2018-01-21T15:00").unix();

      additionalPeriodStartTime6 = moment.utc("2018-01-22T03:00").unix();
      additionalPeriodEndTime6 = moment.utc("2018-01-28T15:00").unix();

      additionalPeriodStartTime7 = moment.utc("2018-01-29T03:00").unix();
      additionalPeriodEndTime7 = moment.utc("2018-02-04T15:00").unix();

      maxEtherCap = 286000 * 10 ** 18;
      minEtherCap = 28600 * 10 ** 18;

      baseRate = 1500;
      additionalBonusAmounts = [
        300e18,
        6000e18,
        8000e18,
        10000e18
      ];

      token_address = "0x2c6c596cfd4c2c3b039db90fd3c8acb564e13251";
      vault_address = "0x47c7a69677e3ded71fd13b94766d15daa4b825dd";
      presale_address = "0xbcf097f2e5f4c76ede2c9fa42f40c349fd0ffe23";

      bountyAddress = "0xd2d09864564b7bb741f1cd0c1633719ae617c85e";
      partnersAddress = "0x714c16435d126c02c7e84c16707b4a1d6ab09147";

      //TODO: check
      ATCController = "0x05bbcf30914239a5dde9e5efded6671518f30196";

      ATCReserveBeneficiary = "0x05bbcf30914239a5dde9e5efded6671518f30196";
      teamBeneficiaries = [
          "0x80049bf695833d1d465623dc1774c8b3e99ca2a7",
          "0xe863985909e518be7b1d2d7a24d9e4100c9a4820",
          "0xdb09e4762bd2c7227207871dc80cff86d090fe92"
      ];

      kyc = await KYC.new();
      console.log("kyc deployed at", kyc.address);

      /*eslint-disable */
      crowdsale = await ATCCrowdSale.new();
      console.log("crowdsale deployed at", crowdsale.address);

      ATCReserveLocker = await ReserveLocker.new(
        token_address,
        crowdsale.address,
        ATCReserveBeneficiary
      );
      console.log("ATCReserveLocker deployed at", ATCReserveLocker.address);

      teamLocker = await TeamLocker.new(
        token_address,
        crowdsale.address,
        teamBeneficiaries
      );
      console.log("teamLocker deployed at", teamLocker.address);

      await crowdsale.initialize(
        kyc.address,
        token_address,
        vault_address,
        presale_address,
        bountyAddress,
        partnersAddress,
        ATCReserveLocker.address,
        teamLocker.address,
        ATCController,
        maxEtherCap,
        minEtherCap,
        baseRate,
        additionalBonusAmounts
      );

      console.log("crowdsale initialized");

      await crowdsale.startPeriod(firstPeriodStartTime, firstPeriodEndTime);
      await crowdsale.startPeriod(additionalPeriodStartTime1, additionalPeriodEndTime1);
      await crowdsale.startPeriod(additionalPeriodStartTime2, additionalPeriodEndTime2);
      await crowdsale.startPeriod(additionalPeriodStartTime3, additionalPeriodEndTime3);
      await crowdsale.startPeriod(additionalPeriodStartTime4, additionalPeriodEndTime4);
      await crowdsale.startPeriod(additionalPeriodStartTime5, additionalPeriodEndTime5);
      await crowdsale.startPeriod(additionalPeriodStartTime6, additionalPeriodEndTime6);
      await crowdsale.startPeriod(additionalPeriodStartTime7, additionalPeriodEndTime7);

      console.log("crowdsale periods started");

    fs.writeFileSync(path.join(__dirname, "../addresses.json"), JSON.stringify({
      token: token_address,
      vault: vault_address,
      presale: presale_address,
      crowdsale: crowdsale.address
      }, undefined, 2));
    } catch (e) {
      console.error(e);
    }
  }
};
