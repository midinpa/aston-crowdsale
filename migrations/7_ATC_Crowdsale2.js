const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ATCPresale = artifacts.require("ATCPresale.sol");
const ATC = artifacts.require("ATC.sol");
const RefundVault = artifacts.require("vault/RefundVault.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

const ATCCrowdSale = artifacts.require("ATCCrowdSale2.sol");
const KYC = artifacts.require("kyc/KYC.sol");
const ReserveLocker = artifacts.require("ReserveLocker.sol");
const TeamLocker = artifacts.require("TeamLocker.sol");

const migration_src = require("../argv.js");

module.exports = async function (deployer, network, accounts) {

  if (migration_src == "7") {
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

      maxEtherCap = 286000e18;
      minEtherCap = 10000e18;

      baseRate = 1500;
      additionalBonusAmounts = [
        300e18,
        6000e18,
        8000e18,
        10000e18
      ];

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

      // tokenFactory = await MiniMeTokenFactory.new();
      // console.log("tokenFactory deployed at", tokenFactory.address);
      //
      // token = await ATC.new(tokenFactory.address);
      // console.log("token deployed at", token.address);
      //
      // vault = await RefundVault.new(vaultOwners);
      // console.log("vault deployed at", vault.address);
      //
      // bountyAddress = "0xd2d09864564b7bb741f1cd0c1633719ae617c85e";
      // partnersAddress = "0x714c16435d126c02c7e84c16707b4a1d6ab09147";
      //
      // //TODO: check
      // ATCController = "0x05bbcf30914239a5dde9e5efded6671518f30196";
      //
      // ATCReserveBeneficiary = "0x05bbcf30914239a5dde9e5efded6671518f30196";
      // teamBeneficiaries = [
      //     "0x80049bf695833d1d465623dc1774c8b3e99ca2a7",
      //     "0xe863985909e518be7b1d2d7a24d9e4100c9a4820",
      //     "0xdb09e4762bd2c7227207871dc80cff86d090fe92"
      // ];
      //
      // kyc = await KYC.new();
      // console.log("kyc deployed at", kyc.address);
      //
      // /*eslint-disable */
      // crowdsale = await ATCCrowdSale.new();
      // console.log("crowdsale deployed at", crowdsale.address);
      //
      // ATCReserveLocker = await ReserveLocker.new(
      //   token.address,
      //   crowdsale.address,
      //   ATCReserveBeneficiary
      // );
      // console.log("ATCReserveLocker deployed at", ATCReserveLocker.address);
      //
      // teamLocker = await TeamLocker.new(
      //   token.address,
      //   crowdsale.address,
      //   teamBeneficiaries
      // );
      // console.log("teamLocker deployed at", teamLocker.address);
      //
      // await token.changeController(crowdsale.address);
      // await vault.transferOwnership(crowdsale.address);
      //
      // await crowdsale.initialize(
      //   kyc.address,
      //   token.address,
      //   vault.address,
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
      //
      // console.log("crowdsale initialized");
      //
      // await crowdsale.startPeriod(firstPeriodStartTime, firstPeriodEndTime);
      // await crowdsale.startPeriod(additionalPeriodStartTime1, additionalPeriodEndTime1);
      // await crowdsale.startPeriod(additionalPeriodStartTime2, additionalPeriodEndTime2);


      crowdsale = ATCCrowdSale.at('0x951f614f81da09c90e6187a14b759f98ed9e7490');

      await crowdsale.startPeriod(additionalPeriodStartTime3, additionalPeriodEndTime3);
      await crowdsale.startPeriod(additionalPeriodStartTime4, additionalPeriodEndTime4);
      await crowdsale.startPeriod(additionalPeriodStartTime5, additionalPeriodEndTime5);
      await crowdsale.startPeriod(additionalPeriodStartTime6, additionalPeriodEndTime6);
      await crowdsale.startPeriod(additionalPeriodStartTime7, additionalPeriodEndTime7);

      console.log("crowdsale periods started");

    // fs.writeFileSync(path.join(__dirname, "../addresses.json"), JSON.stringify({
    //   token: token.address,
    //   vault: vault.address,
    //   crowdsale: crowdsale.address,
    //   ATCReserveLocker: ATCReserveLocker.address,
    //   teamLocker: teamLocker.address
    //   }, undefined, 2));
    } catch (e) {
      console.error(e);
    }
  }
};
