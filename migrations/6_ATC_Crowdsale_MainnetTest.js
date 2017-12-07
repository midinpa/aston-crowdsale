const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ATCPresale = artifacts.require("ATCPresale.sol");
const ATC = artifacts.require("ATC.sol");
const RefundVault = artifacts.require("vault/RefundVault.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

const ATCCrowdSale = artifacts.require("ATCCrowdSale.sol");
const KYC = artifacts.require("kyc/KYC.sol");

const ReserveLocker = artifacts.require("ReserveLockerForDemoInMainnet.sol");
const TeamLocker = artifacts.require("TeamLockerForDemoInMainnet.sol");

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

      const mainsaleRegisteredInvestor1 = "0x5dbd73c817a2330f182172046d4e22579d8ec550";
      const _ATCReserveBeneficiary = "0x7fc28acf90c642422f6d94e3ff2438a4ff8879b1";
      const _teamBeneficiary1 = "0x7511b380de6b172c3cb71404d769995c4d9eb577";
      const owner = "0x266085436a4d9cb25603a3b1ab72338f313d7377";

      const secToMillisec = (sec) => {
        return sec * 1000;
      }
      const toWei = (ether) => {
        return ether * 10 ** 18;
      }
      const timeout = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      const waitUntil = async (targetTime) => {
        let now = moment().unix();
        await timeout(secToMillisec(targetTime - now));
      }
      const sendDemoTxes = async () => {
        // test tx

        await presale.finalizePresale(crowdsale.address, {
          from: owner
        });
        console.log("presale finalized");

        await kyc.register(mainsaleRegisteredInvestor1, {
          from: owner
        });
        console.log("crowdsale register mainsaleRegisteredInvestor1");

        await waitUntil(firstPeriodStartTime + 10);
        console.log("waitUntil after firstPeriodStartTime");
        sendInvestTx();

        await waitUntil(additionalPeriodStartTime1 + 10);
        console.log("waitUntil after additionalPeriodStartTime1");
        sendInvestTx();

        await waitUntil(additionalPeriodStartTime2 + 10);
        console.log("waitUntil after additionalPeriodStartTime2");
        sendInvestTx();

        await waitUntil(additionalPeriodStartTime3 + 10);
        console.log("waitUntil after additionalPeriodStartTime3");
        sendInvestTx();

        await waitUntil(additionalPeriodStartTime4 + 10);
        console.log("waitUntil after additionalPeriodStartTime4");
        sendInvestTx();

        await waitUntil(additionalPeriodStartTime5 + 10);
        console.log("waitUntil after additionalPeriodStartTime5");
        sendInvestTx();

        await waitUntil(additionalPeriodStartTime6 + 10);
        console.log("waitUntil after additionalPeriodStartTime6");
        sendInvestTx();

        await waitUntil(additionalPeriodStartTime7 + 10);
        console.log("waitUntil after additionalPeriodStartTime7");
        sendInvestTx();

        await waitUntil(additionalPeriodEndTime7 + 10);
        console.log("waitUntil after additionalPeriodEndTime7");
        await crowdsale.finalize({
          from: owner
        });
        console.log("crowdsale finalized");

        teamLocker.release({from: _teamBeneficiary1});
        console.log("teamLocker 20% release");

        await waitUntil((await crowdsale.finalizedTime()).add(31 * 60));
        console.log("wait until finalizedTime + 31 minutes");

        teamLocker.release({from: _teamBeneficiary1});
        console.log("teamLocker 50% release");

        await waitUntil((await crowdsale.finalizedTime()).add(61 * 60));
        console.log("wait until finalizedTime + 61 minutes");

        teamLocker.release({from: _teamBeneficiary1});
        console.log("teamLocker 100% release");

        ATCReserveLocker.release({from: _ATCReserveBeneficiary});
        console.log("ATCReserveLocker 100% release");
      }

      const sendInvestTx = () => {

        web3.eth.getTransactionCount(mainsaleRegisteredInvestor1, function (err, current_nonce) {
          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.0001),
            nonce: current_nonce
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.0001 ether");

          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.0003),
            nonce: current_nonce + 1
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.0003 ether");
          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.006),
            nonce: current_nonce + 2
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.006 ether");
          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.008),
            nonce: current_nonce + 3
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.008 ether");
          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.01),
            nonce: current_nonce + 4
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.01 ether");
        }
      }

        firstPeriodStartTime = moment().add(60, "minutes").unix();
        firstPeriodEndTime = moment().add(100, "minutes").unix();

        additionalPeriodStartTime1 = moment().add(105, "minutes").unix();
        additionalPeriodEndTime1 = moment().add(145, "minutes").unix();
        additionalPeriodStartTime2 = moment().add(150, "minutes").unix();
        additionalPeriodEndTime2 = moment().add(190, "minutes").unix();
        additionalPeriodStartTime3 = moment().add(195, "minutes").unix();
        additionalPeriodEndTime3 = moment().add(235, "minutes").unix();
        additionalPeriodStartTime4 = moment().add(240, "minutes").unix();
        additionalPeriodEndTime4 = moment().add(280, "minutes").unix();
        additionalPeriodStartTime5 = moment().add(285, "minutes").unix();
        additionalPeriodEndTime5 = moment().add(325, "minutes").unix();
        additionalPeriodStartTime6 = moment().add(330, "minutes").unix();
        additionalPeriodEndTime6 = moment().add(370, "minutes").unix();
        additionalPeriodStartTime7 = moment().add(375, "minutes").unix();
        additionalPeriodEndTime7 = moment().add(415, "minutes").unix();

        maxEtherCap = 1e18; //mainnet : 286000 ether
        minEtherCap = 5e16; //mainnet : 28600

        baseRate = 1500;
        additionalBonusAmounts = [
          300e12,
          6000e12,
          8000e12,
          10000e12
        ];

        token_address = "0xec08fda4c40e0b0d8927eabd1e6f1105f2398473";
        vault_address = "0x01538ba832526293decfefa3dc76cc6b8c68d213";
        presale_address = "0xdb9095aa4c0594adb0e1db7d887300ba206e048a";

        bountyAddress = "0xcc0b7bfb34c17cc6e21d00a542e22fe2000f8a33";
        partnersAddress = "0xcf0394e0b3b983604e47f6332beb83115313dfb7";

        ATCController = "0x266085436a4d9cb25603a3b1ab72338f313d7377";

        ATCReserveBeneficiary = "0x7fc28acf90c642422f6d94e3ff2438a4ff8879b1";
        teamBeneficiaries = [
            "0x7511b380de6b172c3cb71404d769995c4d9eb577",
            "0xeccdd8cc9fca423aeda4fc9c382b9d49f4c98f7e",
            "0xf5e39c9a2cb992e03f05f4b6514f3e6e76fac8dc"
        ];

        kyc = await KYC.new();
        console.log("kyc deployed at", kyc.address);

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

        sendDemoTxes();

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
