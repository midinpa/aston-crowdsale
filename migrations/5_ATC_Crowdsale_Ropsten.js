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
const BigNumber = require('bignumber.js');

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

      const presaleRegisteredInvestor1 = accounts[1];
      const presaleRegisteredInvestor2 = accounts[2];
      const mainsaleRegisteredInvestor1 = accounts[3];
      const mainsaleRegisteredInvestor2 = accounts[4];
      const UnregisteredInvestor1 = accounts[5];
      const _ATCReserveBeneficiary = accounts[7];
      const _teamBeneficiary1 = accounts[8];

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
        //presale Test

        await presale.register(presaleRegisteredInvestor1, toWei(0.5), {
          from: accounts[0]
        });
        console.log("presaleRegisteredInvestor1 registered (0.5 ether)");
        await presale.register(presaleRegisteredInvestor2, toWei(0.4), {
          from: accounts[0]
        });
        console.log("presaleRegisteredInvestor2 registered (0.4 ether)");

        presale.buyPresale(presaleRegisteredInvestor1, {
          from: presaleRegisteredInvestor1,
          value: toWei(0.5)
        });
        console.log("presaleRegisteredInvestor1 send 0.5 ether (should be reverted)");

        await waitUntil(presaleStartTime + 10);
        console.log("waitUntil after presaleStartTime");

        presale.buyPresale(presaleRegisteredInvestor1, {
          from: presaleRegisteredInvestor1,
          value: toWei(0.5)
        });
        console.log("presaleRegisteredInvestor1 send 0.5 ether (should be accepted)");

        presale.buyPresale(presaleRegisteredInvestor2, {
          from: presaleRegisteredInvestor2,
          value: toWei(0.5)
        });
        console.log("presaleRegisteredInvestor2 send 0.5 ether (should be accepted only 0.4 ether)");

        presale.buyPresale(UnregisteredInvestor1, {
          from: UnregisteredInvestor1,
          value: toWei(0.1)
        });
        console.log("UnregisteredInvestor1 send 0.1 ether (should be rejected)");

        await waitUntil(presaleEndTime + 10);
        console.log("waitUntil after presaleEndTime");

        await presale.finalizePresale(crowdsale.address, {
          from: accounts[0]
        });
        console.log("presale finalized");

        //mainnet Test

        console.log("crowdsale weiRaised (should be 9e17): ", await crowdsale.weiRaised());

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

        web3.eth.getTransactionCount(mainsaleRegisteredInvestor1, function (err, current_nonce) {
          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.01),
            nonce: current_nonce
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.01 ether");

          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.03),
            nonce: current_nonce + 1
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.03 ether");

          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.6),
            nonce: current_nonce + 2
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.6 ether");

          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(0.8),
            nonce: current_nonce + 3
          });
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 0.8 ether");

          crowdsale.buy(mainsaleRegisteredInvestor1, {
            from: mainsaleRegisteredInvestor1,
            value: toWei(1),
            nonce: current_nonce + 4
          })
          console.log("crowdsale mainsaleRegisteredInvestor1 invest 1 ether");
        });

      }

        const presaleStartTime = moment().add(20, "minutes").unix();
        const presaleEndTime = moment().add(30, "minutes").unix();
        const presaleMaxEtherCap = 30e18;
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
        firstPeriodEndTime = moment().add(45, "minutes").unix();

        additionalPeriodStartTime1 = moment().add(50, "minutes").unix();
        additionalPeriodEndTime1 = moment().add(60, "minutes").unix();
        additionalPeriodStartTime2 = moment().add(65, "minutes").unix();
        additionalPeriodEndTime2 = moment().add(75, "minutes").unix();
        additionalPeriodStartTime3 = moment().add(80, "minutes").unix();
        additionalPeriodEndTime3 = moment().add(90, "minutes").unix();
        additionalPeriodStartTime4 = moment().add(95, "minutes").unix();
        additionalPeriodEndTime4 = moment().add(105, "minutes").unix();
        additionalPeriodStartTime5 = moment().add(110, "minutes").unix();
        additionalPeriodEndTime5 = moment().add(120, "minutes").unix();
        additionalPeriodStartTime6 = moment().add(125, "minutes").unix();
        additionalPeriodEndTime6 = moment().add(135, "minutes").unix();
        additionalPeriodStartTime7 = moment().add(140, "minutes").unix();
        additionalPeriodEndTime7 = moment().add(150, "minutes").unix();

        maxEtherCap = 30e18; //mainnet : 286000 ether
        minEtherCap = 5e18; //mainnet : 28600

        baseRate = 1500;
        additionalBonusAmounts = [
          new BigNumber(300e14),
          new BigNumber(6000e14),
          new BigNumber(8000e14),
          new BigNumber(10000e14)
        ];

        bountyAddress = "0xd2d09864564b7bb741f1cd0c1633719ae617c85e";
        partnersAddress = "0x714c16435d126c02c7e84c16707b4a1d6ab09147";

        //for ropsten demo account
        ATCReserveBeneficiary = "0xa4ef760ed5ccd81a2073359a6c3017671f03d1d9";
        //for ropsten demo account
        teamBeneficiaries = [
            "0xe5e1ae713575f229f9b358c9362efc5c336ccc47",
            "0x822433f134e739dca9e1454c5a2bee88c20628e1",
            "0x68f92c86a9f2d7067afc08294676725f09910684"
        ];
        //for ropsten demo account
        ATCController = "0x0166685dD1FA8e6c061B13Fc16fFf3DEA94E8ba2";

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

        await sendDemoTxes();

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
