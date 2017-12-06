const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ATCPresale = artifacts.require("ATCPresale.sol");
const ATC = artifacts.require("ATC.sol");
const RefundVault = artifacts.require("vault/RefundVault.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

const ATCCrowdSale = artifacts.require("ATCCrowdSale.sol");
const KYC = artifacts.require("kyc/KYC.sol");

const ReserveLocker = artifacts.require("ReserveLockerForDemo.sol");
const TeamLocker = artifacts.require("TeamLockerForDemo.sol");

const migration_src = require("../argv.js");

module.exports = async function (deployer, network, accounts) {

  if (migration_src == "5") {
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

      const presaleRegisteredInvestor1 = "0x059923c0c3fbbf5bac86b098bc4c9df02c01829d";
      const presaleRegisteredInvestor2 = "0x0970c9fb7cb7f01307debfdf775e536b89a38ab5";
      const mainsaleRegisteredInvestor1 = "0x5dbd73c817a2330f182172046d4e22579d8ec550";
      const UnregisteredInvestor1 = "0x1e2de1110149fb5d78cab2974b13b58b40c15dfd";
      const _ATCReserveBeneficiary = "0x7511b380de6b172c3cb71404d769995c4d9eb577";
      const _teamBeneficiary1 = "0x7fc28acf90c642422f6d94e3ff2438a4ff8879b1";

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
        await presale.register(presaleRegisteredInvestor1, toWei(0.01), {
          from: accounts[0]
        });
        console.log("presaleRegisteredInvestor1 registered (0.01 ether)");
        await presale.register(presaleRegisteredInvestor2, toWei(0.01), {
          from: accounts[0]
        });
        console.log("presaleRegisteredInvestor2 registered (0.01 ether)");

        presale.buyPresale(presaleRegisteredInvestor1, {
          from: presaleRegisteredInvestor1,
          value: toWei(0.01)
        });
        console.log("presaleRegisteredInvestor1 send 0.01 ether (should be reverted)");

        await waitUntil(presaleStartTime + 10);
        console.log("waitUntil after presaleStartTime");

        presale.buyPresale(presaleRegisteredInvestor1, {
          from: presaleRegisteredInvestor1,
          value: toWei(0.01)
        });
        console.log("presaleRegisteredInvestor1 send 0.01 ether (should be accepted)");

        presale.buyPresale(presaleRegisteredInvestor2, {
          from: presaleRegisteredInvestor2,
          value: toWei(0.02)
        });
        console.log("presaleRegisteredInvestor2 send 0.02 ether (should be accepted only 0.01 ether)");

        presale.buyPresale(UnregisteredInvestor1, {
          from: UnregisteredInvestor1,
          value: toWei(0.01)
        });
        console.log("UnregisteredInvestor1 send 0.01 ether (should be rejected)");

        await waitUntil(presaleEndTime + 10);
        console.log("waitUntil after presaleEndTime");

        await presale.finalizePresale(crowdsale.address, {
          from: accounts[0]
        });
        console.log("presale finalized");

        await kyc.register(mainsaleRegisteredInvestor1, {
          from: accounts[0]
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
          from: accounts[0]
        });
        console.log("crowdsale finalized");

        teamLocker.release({from: _teamBeneficiary1});
        console.log("teamLocker 20% release");

        await waitUntil((await crowdsale.finalizedTime()).add(11 * 60));
        console.log("wait until finalizedTime + 11 minutes");

        teamLocker.release({from: _teamBeneficiary1});
        console.log("teamLocker 50% release");

        await waitUntil((await crowdsale.finalizedTime()).add(21 * 60));
        console.log("wait until finalizedTime + 21 minutes");

        teamLocker.release({from: _teamBeneficiary1});
        console.log("teamLocker 100% release");

        ATCReserveLocker.release({from: _ATCReserveBeneficiary});
        console.log("ATCReserveLocker 100% release");
      }

      const sendInvestTx = () => {
        crowdsale.buy(mainsaleRegisteredInvestor1, {
          from: mainsaleRegisteredInvestor1,
          value: toWei(0.0001)
        });
        console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.0001 ether");

        crowdsale.buy(mainsaleRegisteredInvestor1, {
          from: mainsaleRegisteredInvestor1,
          value: toWei(0.0003)
        });
        console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.0003 ether");
        crowdsale.buy(mainsaleRegisteredInvestor1, {
          from: mainsaleRegisteredInvestor1,
          value: toWei(0.006)
        });
        console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.006 ether");
        crowdsale.buy(mainsaleRegisteredInvestor1, {
          from: mainsaleRegisteredInvestor1,
          value: toWei(0.008)
        });
        console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.008 ether");
        crowdsale.buy(mainsaleRegisteredInvestor1, {
          from: mainsaleRegisteredInvestor1,
          value: toWei(0.01)
        });
        console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.01 ether");
      }

        const presaleStartTime = moment().add(20, "minutes").unix();
        const presaleEndTime = moment().add(30, "minutes").unix();
        const presaleMaxEtherCap = 1 * 10 ** 18;
        const presaleRate = 1950;

        vaultOwners = [
          "0x4b44b64292e9053cade94bcac96f1995eb4b3bea",
          "0x4e93ea4b357b8e2f18cb7ca98a08d1a611b72d38",
          "0x4f457c062001ba56f60c053ad03961f7fc9a0420",
          "0x6397433fd2753ca62356e78bc1c27b07044bc7c0",
          "0x643b48dacaaa1191ed607e74c6363c711e625118",
          "0x70f4f24758e6b2f7044ca624e71e3bba1214f66c",
          "0x82fd455fede4f676432026122092bb31c51bd31d",
          "0x895e7cd7437d49344db362c42ac07a919f40d66b",
          "0x957ce4ef3a0be9365bdcd6897caae932b7de6a6b",
          "0xbc5eb105ec8739763d25287efcd802cd0b7b08f3"
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

        maxEtherCap = 1e18; //mainnet : 286000 ether
        minEtherCap = 5e16; //mainnet : 28600

        baseRate = 1500;
        additionalBonusAmounts = [
          300e12,
          6000e12,
          8000e12,
          10000e12
        ];

        bountyAddress = "0xcc0b7bfb34c17cc6e21d00a542e22fe2000f8a33";
        partnersAddress = "0xcf0394e0b3b983604e47f6332beb83115313dfb7";

        ATCReserveBeneficiary = "0x7511b380de6b172c3cb71404d769995c4d9eb577";

        teamBeneficiaries = [
            "0x7fc28acf90c642422f6d94e3ff2438a4ff8879b1",
            "0xeccdd8cc9fca423aeda4fc9c382b9d49f4c98f7e",
            "0xf5e39c9a2cb992e03f05f4b6514f3e6e76fac8dc"
        ];

        ATCController = "0x266085436a4d9cb25603a3b1ab72338f313d7377";

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
