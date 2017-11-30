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
      let ATCReserveReleaseTime;
      let teamReleaseTimelines;

      let baseRate;
      let additionalBonusAmounts;

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
          300 * 10 * 18,
          6000 * 10 ** 18,
          8000 * 10 ** 18,
          10000 * 10 ** 18
        ];

        bountyAddress = "0xd2d09864564b7bb741f1cd0c1633719ae617c85e";
        partnersAddress = "0x714c16435d126c02c7e84c16707b4a1d6ab09147";

        ATCReserveBeneficiary = "0x05bbcf30914239a5dde9e5efded6671518f30196";
        //TODO
        ATCReserveReleaseTime = moment().add(140, "minutes").unix();

        teamBeneficiaries = [
            "0x80049bf695833d1d465623dc1774c8b3e99ca2a7",
            "0xe863985909e518be7b1d2d7a24d9e4100c9a4820",
            "0xdb09e4762bd2c7227207871dc80cff86d090fe92"
        ];
        //TODO
        teamReleaseTimelines = [
          moment().add(130, "minutes").unix(),
          moment().add(140, "minutes").unix(),
        ];
        teamReleaseRatios = [
          20,
          50,
        ];

        // TODO
        ATCController = "0x7a1bd647f350c130f0d33ae3d76ee28f12070424";

        // ATCReserveLocker = await ReserveLocker.new(
        //   token.address,
        //   ATCReserveBeneficiary,
        //   ATCReserveReleaseTime,
        // );
        // console.log("ATCReserveLocker deployed at", ATCReserveLocker.address);
        //
        // teamLocker = await TeamLocker.new(
        //   token.address,
        //   teamBeneficiaries,
        //   teamReleaseTimelines,
        //   teamReleaseRatios,
        // );
        // console.log("teamLocker deployed at", teamLocker.address);
        //
        // kyc = await KYC.new();
        // console.log("kyc deployed at", kyc.address);

        // /*eslint-disable */
        // crowdsale = await ATCCrowdSale.new(
        //   kyc.address,
        //   token.address,
        //   vault.address,
        //   presale.address,
        //   bountyAddress,
        //   partnersAddress,
        //   ATCReserveLocker.address,
        //   teamLocker.address,
        //   ATCController,
        //   maxEtherCap,
        //   minEtherCap,
        //   baseRate,
        //   additionalBonusAmounts
        // );
        // console.log("crowdsale deployed at", crowdsale.address);
        //
        // await crowdsale.startPeriod(firstPeriodStartTime, firstPeriodEndTime);
        // await crowdsale.startPeriod(additionalPeriodStartTime1, additionalPeriodEndTime1);
        // await crowdsale.startPeriod(additionalPeriodStartTime2, additionalPeriodEndTime2);
        // await crowdsale.startPeriod(additionalPeriodStartTime3, additionalPeriodEndTime3);
        // await crowdsale.startPeriod(additionalPeriodStartTime4, additionalPeriodEndTime4);
        // await crowdsale.startPeriod(additionalPeriodStartTime5, additionalPeriodEndTime5);
        // await crowdsale.startPeriod(additionalPeriodStartTime6, additionalPeriodEndTime6);
        // await crowdsale.startPeriod(additionalPeriodStartTime7, additionalPeriodEndTime7);
        //
        // console.log("crowdsale periods started");

      fs.writeFileSync(path.join(__dirname, "../addresses.json"), JSON.stringify({
        token: token.address,
        vault: vault.address,
        presale: presale.address,
        crowdsale: crowdsale.address,
        ATCReserveLocker: ATCReserveLocker.address,
        teamLocker: teamLocker.address
      }, undefined, 2));
    } catch (e) {
      console.error(e);
    }
  }
};
