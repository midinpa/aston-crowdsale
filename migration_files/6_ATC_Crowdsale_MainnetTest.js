const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ATCPresale = artifacts.require("ATCPresale.sol");
const ATC = artifacts.require("ATC.sol");
const RefundVault = artifacts.require("vault/RefundVault.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

const ATCCrowdSale = artifacts.require("ATCCrowdSale.sol");
const KYC = artifacts.require("kyc/KYC.sol");

//TODO: FOR DEMO
const ReserveLocker = artifacts.require("ReserveLockerForDemo.sol");
const TeamLocker = artifacts.require("TeamLockerForDemo.sol");

const migration_src = require("../argv.js");

module.exports = async function (deployer, network, accounts) {

  if (migration_src == "6") {
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

        const presaleStartTime = moment().add(10, "minutes").unix();
        const presaleEndTime = moment().add(25, "minutes").unix();
        const presaleMaxEtherCap = 10 * 10 ** 18;
        const presaleRate = 1950;

        vaultOwners = [
          "0x85f619b71bd475d61afcf834012c92aaafb4638c",
          "0xca1fdd22010b0b285d54175376c2ba246cf64f6d",
          "0x12336615e1195eb972edbda3d06d090f11b692e1",
          "0x744719574324ad5f21e7d4e9230795556d18d26b",
          "0xd91915cc062b663a8370e6bb6117b2670279a986",
          "0x7739fff8cc653e6bc92dd58c3672680895dd00da",
          "0x5e2ea1a30fe54957e77e2370840aab8be2b55dc6",
          "0x93bc7aa9bff7755f7c51685c0a800e41bf1a8c4f",
          "0xb1544acc9ab5d596d87fdfa588ee8074b48fe168",
          "0xc9a7fa941a334aef53c0f6900d07b7634fdf3367"
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

        // //////////////
        // PRESALE DONE//
        // //////////////

        firstPeriodStartTime = moment().add(35, "minutes").unix();
        firstPeriodEndTime = moment().add(50, "minutes").unix();

        additionalPeriodStartTime1 = moment().add(55, "minutes").unix();
        additionalPeriodEndTime1 = moment().add(60, "minutes").unix();
        additionalPeriodStartTime2 = moment().add(65, "minutes").unix();
        additionalPeriodEndTime2 = moment().add(70, "minutes").unix();
        additionalPeriodStartTime3 = moment().add(75, "minutes").unix();
        additionalPeriodEndTime3 = moment().add(80, "minutes").unix();
        additionalPeriodStartTime4 = moment().add(85, "minutes").unix();
        additionalPeriodEndTime4 = moment().add(90, "minutes").unix();
        additionalPeriodStartTime5 = moment().add(95, "minutes").unix();
        additionalPeriodEndTime5 = moment().add(100, "minutes").unix();
        additionalPeriodStartTime6 = moment().add(105, "minutes").unix();
        additionalPeriodEndTime6 = moment().add(110, "minutes").unix();
        additionalPeriodStartTime7 = moment().add(115, "minutes").unix();
        additionalPeriodEndTime7 = moment().add(120, "minutes").unix();

        maxEtherCap = 10 * 10 ** 18; //mainnet : 286000 ether
        minEtherCap = 5 * 10 ** 18; //mainnet : 28600

        baseRate = 1500;
        additionalBonusAmounts = [
          300 * 10 * 14,
          6000 * 10 ** 14,
          8000 * 10 ** 14,
          10000 * 10 ** 14
        ];

        bountyAddress = "0xd2d09864564b7bb741f1cd0c1633719ae617c85e";
        partnersAddress = "0x714c16435d126c02c7e84c16707b4a1d6ab09147";

        ATCReserveBeneficiary = "0x05bbcf30914239a5dde9e5efded6671518f30196";
        teamBeneficiaries = [
            "0x80049bf695833d1d465623dc1774c8b3e99ca2a7",
            "0xe863985909e518be7b1d2d7a24d9e4100c9a4820",
            "0xdb09e4762bd2c7227207871dc80cff86d090fe92"
        ];
        ATCController = "0x05bbcf30914239a5dde9e5efded6671518f30196";

        kyc = await KYC.new();
        console.log("kyc deployed at", kyc.address);

        crowdsale = await ATCCrowdSale.new();
        console.log("crowdsale deployed at", crowdsale.address);

        ATCReserveLocker = await ReserveLocker.new(
          token.address,
          crowdsale.address,
          ATCReserveBeneficiary
        );
        console.log("ATCReserveLocker deployed at", ATCReserveLocker.address);

        teamLocker = await TeamLocker.new(
          token.address,
          crowdsale.address,
          teamBeneficiaries
        );
        console.log("teamLocker deployed at", teamLocker.address);

        await crowdsale.initialize(
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

        // sendDemoTxes();

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
