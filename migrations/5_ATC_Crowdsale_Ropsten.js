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
  console.log("[accounts]");
  accounts.forEach((account, i) => console.log(`[${ i }]  ${ account }`));

  if (migration_src == "5") {
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


      // const secToMillisec = (sec) => {
      //   return sec * 1000;
      // }
      // const toWei = (ether) => {
      //   return ether * 10 ** 18;
      // }
      // const timeout = (ms) => {
      //   return new Promise(resolve => setTimeout(resolve, ms));
      // }
      // const waitUntil = async (targetTime) => {
      //   let now = moment().unix();
      //   await timeout(secToMillisec(targetTime - now));
      // }
      // const sendDemoTxes = () => {
      //   // test tx
      //   const presaleRegisteredInvestor1 = accounts[1];
      //   const presaleRegisteredInvestor2 = accounts[2];
      //   const mainsaleRegisteredInvestor1 = accounts[3];
      //   const mainsaleRegisteredInvestor2 = accounts[4];
      //   const UnregisteredInvestor1 = accounts[5];
      //
      //   await presale.register(presaleRegisteredInvestor1, toWei(0.5), {
      //     from: accounts[0]
      //   });
      //   console.log("presaleRegisteredInvestor1 registered (0.5 ether)");
      //   await presale.register(presaleRegisteredInvestor2, toWei(0.4), {
      //     from: accounts[0]
      //   });
      //   console.log("presaleRegisteredInvestor2 registered (0.4 ether)");
      //
      //   presale.buyPresale(presaleRegisteredInvestor1, {
      //     from: presaleRegisteredInvestor1,
      //     value: toWei(0.5)
      //   });
      //
      //   console.log("presaleRegisteredInvestor1 send 0.5 ether (should be reverted)");
      //
      //   await waitUntil(presaleStartTime + 100);
      //
      //   presale.buyPresale(presaleRegisteredInvestor1, {
      //     from: presaleRegisteredInvestor1,
      //     value: toWei(0.5)
      //   });
      //
      //   console.log("presaleRegisteredInvestor1 send 0.5 ether (should be accepted)");
      //
      //   presale.buyPresale(presaleRegisteredInvestor2, {
      //     from: presaleRegisteredInvestor2,
      //     value: toWei(0.5)
      //   });
      //
      //   console.log("presaleRegisteredInvestor1 send 0.5 ether (should be accepted only 0.4 ether)");
      //
      //   presale.buyPresale(UnregisteredInvestor1, {
      //     from: UnregisteredInvestor1,
      //     value: toWei(0.1)
      //   });
      //
      //   console.log("UnregisteredInvestor1 send 0.1 ether (should be rejected)");
      //
      //   await waitUntil(presaleEndTime + 100);
      //
      //   await presale.finalizePresale(crowdsale.address, {
      //     from: accounts[0]
      //   });
      //
      //   console.log("presale finalized");
      //
      //   token.transfer(UnregisteredInvestor1, toWei(1), {
      //     from: presaleRegisteredInvestor1
      //   });
      //
      //   console.log("presaleRegisteredInvestor1 transfer token to UnregisteredInvestor1 (should be rejected)");
      // }

        const presaleStartTime = moment().add(10, "minutes").unix();
        const presaleEndTime = moment().add(25, "minutes").unix();
        const presaleMaxEtherCap = 1 * 10 ** 18;
        const presaleRate = 1950;

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
        ]

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

        bountyAddress = "0x922aa0d0e720caf10bcd7a02be187635a6f36ab0";
        partnersAddress = "0xd70705f93472420cc8c6199aca5308df6bd5011b";

        ATCReserveBeneficiary = "0x4406f24bddd69845abe275426330ecb02abbc7ac";
        ATCReserveReleaseTime = moment().add(140, "minutes").unix();

        teamBeneficiaries = [
            "0x11030eb285ce72b6d4fb364fc1ad7f7d671a8eba",
            "0x0246f237b2c3b9ed15ec47575a3157fd2f9d90b6",
            "0x54ba7a145e0125f307de15851d59f4ae400d4b31"
        ];
        teamReleaseTimelines = [
          moment().add(130, "minutes").unix(),
          moment().add(140, "minutes").unix(),
        ];
        teamReleaseRatios = [
          20,
          50,
        ];

        // TODO: ATCPLACEHOLDER ?
        ATCController = "0x7a1bd647f350c130f0d33ae3d76ee28f12070424";

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
          baseRate,
          additionalBonusAmounts
        );
        console.log("crowdsale deployed at", crowdsale.address);

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
