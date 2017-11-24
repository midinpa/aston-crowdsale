import ether from "./helpers/ether";
import { advanceBlock } from "./helpers/advanceToBlock";
import { increaseTimeTo, duration } from "./helpers/increaseTime";
import latestTime from "./helpers/latestTime";
import EVMThrow from "./helpers/EVMThrow";
import { capture, restore } from "./helpers/snapshot";
import moment from "moment";

const BigNumber = web3.BigNumber;
const eth = web3.eth;

const should = require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

  const ATCPresale = artifacts.require("ATCPresale.sol");
  const ATC = artifacts.require("ATC.sol");
  const RefundVault = artifacts.require("vault/RefundVault.sol");
  const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

  const ATCCrowdSale = artifacts.require("ATCCrowdSale.sol");
  const KYC = artifacts.require("kyc/KYC.sol");
  const ReserveLocker = artifacts.require("ReserveLocker.sol");
  const TeamLocker = artifacts.require("TeamLocker.sol");


class Period {
  constructor(startTime, endTime, bonus) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.bonus = bonus;
  }
}

contract(
  "ATCCrowdSale",
  async (
    [
      owner,
      investor1,
      investor2,
      investor3,
      investor4,
      investor5,
      bountyAddress,
      partnersAddress,
      ,
      ,
      vaultOwner0,
      vaultOwner1,
      vaultOwner2,
      vaultOwner3,
      vaultOwner4,
      vaultOwner5,
      vaultOwner6,
      vaultOwner7,
      vaultOwner8,
      vaultOwner9,
      ATCReserveBeneficiary,
      teamBeneficiary0,
      teamBeneficiary1,
      teamBeneficiary2,
      ATCController,
      ...accounts
    ],
  ) => {
    let snapshotId;

    let presale, crowdsale, token, kyc, vault, tokenFactory;

    let baseTime = moment();
    let now, presaleStartTime, presaleEndTime;
    let beforePresaleStartTime, afterPresaleEndTime, afterPresaleStartTime;
    let periods, baseRate, presaleRate;
    let additionalBonus1, additionalBonus2;
    let getAdditionalBonus, getRate, period, periodIndex;

    let maxEtherCap, minEtherCap;

    let bountyAddresses, vaultOwner;

    let cumulativeWeiRaised;

    let registeredAddresses, unregisteredAddresses;

    let ATCReserveLocker, teamLocker;
    let ATCReserveReleaseTime, teamReleaseTimelines, teamReleaseRatios;
    let teamBeneficiaries;

    const newOwner = accounts[ 25 ];

    const contractDeploy = async (logging = true) => {
      const logger = (...args) => (logging ? console.log(...args) : null);

      vaultOwner = [
        vaultOwner0,
        vaultOwner1,
        vaultOwner2,
        vaultOwner3,
        vaultOwner4,
        vaultOwner5,
        vaultOwner6,
        vaultOwner7,
        vaultOwner8,
        vaultOwner9,
      ];

      cumulativeWeiRaised = new BigNumber(0);

      registeredAddresses = accounts.slice(0, 10);
      unregisteredAddresses = accounts.slice(10, 20);

      baseTime = baseTime.add(1, "month");
      now = baseTime.unix();
      presaleStartTime = baseTime.add(5, "minutes").unix();
      presaleEndTime = baseTime.add(5, "minutes").unix();

      maxEtherCap = ether(286000);
      minEtherCap = ether(28600);

      baseRate = new BigNumber(1500);
      presaleRate = baseRate.mul(1.30); // 30% bonus for presale
      additionalBonus1 = new BigNumber(5); // 5% bonus for more than 300 ETH
      additionalBonus2 = new BigNumber(10); // 10% bonus for more than 6000 ETH

      getAdditionalBonus = (amount) => {
        if (amount.gte(ether(6000))) return additionalBonus2;
        else if (amount.gte(ether(300))) return additionalBonus1;
        return new BigNumber(0);
      };

      getRate = (amount) => {
        const bonus = period.bonus.add(getAdditionalBonus(amount));
        return baseRate.mul(bonus.add(100).div(100));
      };

      /*eslint-disable */
      periods = [
        new Period( // 0
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(15)
        ),
        new Period( // 1
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(10)
        ),
        new Period( // 2
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(5)
        ),
        new Period( // 3
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(0)
        ),
        new Period( // 4
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(0)
        ),
        new Period( // 5
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(0)
        ),
        new Period( // 6
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(0)
        ),
        new Period( // 7 for revert (over 7 days)
          baseTime.add(5, "minutes").unix(),
          baseTime.add(8, "days").unix(),
          new BigNumber(0)
        ),
        new Period( // 7
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(0)
        ),
        new Period( // 8
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(0)
        ),
      ];

      teamReleaseTimelines = [
        baseTime.add(5, "minutes").unix(),
        baseTime.add(5, "minutes").unix()
      ];
      ATCReserveReleaseTime = baseTime.unix();

      teamReleaseRatios = [
        20,
        50
      ];

      teamBeneficiaries = [
        teamBeneficiary0,
        teamBeneficiary1,
        teamBeneficiary2
      ]

      /* eslint-enable */
      tokenFactory = await MiniMeTokenFactory.new();
      logger("tokenFactory deployed at", tokenFactory.address);

      token = await ATC.new(tokenFactory.address);
      logger("token deployed at", token.address);

      vault = await RefundVault.new(vaultOwner);
      logger("vault deployed at", vault.address);

      /*eslint-disable */
      presale = await ATCPresale.new(
        token.address,
        vault.address,
        presaleStartTime,
        presaleEndTime,
        maxEtherCap,
        presaleRate
      );
      /* eslint-enable */
      logger("presale deployed at", presale.address);

      await token.changeController(presale.address);
      await vault.transferOwnership(presale.address);

      // //////////////
      // PRESALE DONE//
      // //////////////

      ATCReserveLocker = await ReserveLocker.new(
        token.address,
        ATCReserveBeneficiary,
        ATCReserveReleaseTime
      );
      logger("ATCReserveLocker deployed at", ATCReserveLocker.address);

      teamLocker = await TeamLocker.new(
        token.address,
        teamBeneficiaries,
        teamReleaseTimelines,
        teamReleaseRatios
      );
      logger("teamLocker deployed at", teamLocker.address);

      kyc = await KYC.new();
      logger("kyc deployed at", kyc.address);

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
      /* eslint-enable */
      logger("crowdsale deployed at", crowdsale.address);

      // backup
      snapshotId = await capture();

      beforePresaleStartTime = presaleStartTime - duration.seconds(100);
      afterPresaleStartTime = presaleStartTime + duration.seconds(1);
      afterPresaleEndTime = presaleEndTime + duration.seconds(100);

      logger(`
------------------------------

\t[TIME]
presaleStartTime:\t\t${ presaleStartTime }
presaleEndTime:\t\t\t${ presaleEndTime }

beforePresaleStartTime:\t\t${ beforePresaleStartTime }
afterPresaleStartTime:\t\t${ afterPresaleStartTime }
afterPresaleEndTime:\t\t${ afterPresaleEndTime }

now:\t\t\t\t${ now }

------------------------------
`);
    };

    before(contractDeploy);

    beforeEach(async () => {
      // restore
      await restore(snapshotId);

      // backup
      snapshotId = await capture();

      // proceed 20 block
      for (const i of Array(20)) {
        await advanceBlock();
      }
    });

    describe("ATCCrowdSale Test", async () => {
      it("Sequential Test", async () => {
        let investAmount;

        await increaseTimeTo(beforePresaleStartTime);

        investAmount = ether(1000);
        const registerTx = await presale.register(investor1, investAmount)
          .should.be.fulfilled;
        console.log("presale registered");

        (await presale.registeredAddress(investor1))
          .should.be.equal(true);

        await increaseTimeTo(afterPresaleStartTime);

        const purchaseTx = await presale.buyPresale(investor1, {
          value: investAmount,
          from: investor1,
        }).should.be.fulfilled;

        cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

        (await token.balanceOf(investor1))
          .should.be.bignumber.equal(investAmount.mul(presaleRate));
        console.log("presale purchase");

        await increaseTimeTo(afterPresaleEndTime);

        const finalizeTx = await presale.finalizePresale(crowdsale.address)
          .should.be.fulfilled;
        (await crowdsale.presaleFallBackCalled())
          .should.be.equal(true);
        console.log("presale finalize");

        await kyc.registerByList([ investor1, investor2, investor3, investor4, investor5 ])
          .should.be.fulfilled;
        console.log("kyc register");

        // reject purchase before period started
        await crowdsale.buy(investor1, {
          from: investor1,
          value: ether(10),
        }).should.be.rejectedWith(EVMThrow);
        console.log("reject purchase before period");

        periodIndex = 0;
        period = periods[ periodIndex++ ];

        await increaseTimeTo(period.startTime - duration.seconds(100));

        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 0 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));

        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        console.log("period 0 bonus checked");
        investAmount = ether(1);

        await crowdsale.buy(investor5, {
          from: investor5,
          value: investAmount,
        }).should.be.fulfilled;
        cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

        (await token.balanceOf(investor5))
          .should.be.bignumber.equal(
            investAmount.mul(getRate(investAmount)));
        // investAmount.mul(baseRate.mul(period.bonus.add(100).div(100))));

        console.log("period0: investor5 buy tokens(1 ether)");

        investAmount = ether(300);

        await crowdsale.buy(investor2, {
          from: investor2,
          value: investAmount,
        }).should.be.fulfilled;
        cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

        (await token.balanceOf(investor2))
          .should.be.bignumber.equal(
            investAmount.mul(getRate(investAmount)));

        console.log("period0: investor2 buy tokens(300 ether)");

        investAmount = ether(6000);

        await crowdsale.buy(investor3, {
          from: investor3,
          value: investAmount,
        }).should.be.fulfilled;
        cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

        (await token.balanceOf(investor3))
          .should.be.bignumber.equal(
            investAmount.mul(getRate(investAmount)));

        console.log("period0: investor3 buy tokens(6000 ether)");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));

        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 1 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));
        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        console.log("period 1 bonus checked");

        // accept purchase by many investors
        const investors = accounts.slice(0, 10);
        await kyc.registerByList(investors)
          .should.be.fulfilled;

        for (const investor of investors) {
          if (await crowdsale.maxReached()) {
            break;
          }

          investAmount = ether(5000);

          await crowdsale.buy(investor, {
            from: investor,
            value: investAmount,
          }).should.be.fulfilled;
          cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

          (await token.balanceOf(investor))
            .should.be.bignumber.equal(investAmount.mul(getRate(investAmount)));
        }

        console.log("period1: many investors purchased (each 5000 ether)");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 2 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));
        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        console.log("period 2 bonus checked");

        investAmount = ether(100);

        await crowdsale.buy(investor4, {
          from: investor4,
          value: investAmount,
        }).should.be.fulfilled;
        cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

        (await token.balanceOf(investor4))
          .should.be.bignumber.equal(investAmount.mul(getRate(investAmount)));

        console.log("period2: investor4 buy tokens(100 ether)");

        await token.transfer(investor2, 100, { from: investor1 })
          .should.be.rejectedWith(EVMThrow);

        console.log("token transfer rejected");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 3 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));
        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        console.log("period 3 bonus checked");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 4 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));
        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        console.log("period 4 bonus checked");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 5 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));
        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        console.log("period 5 bonus checked");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 6 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));
        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        console.log("period 6 bonus checked");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.rejectedWith(EVMThrow);

        console.log("period 7 (for testing revert 7 days) reverted");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 7 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));
        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        console.log("period 7 bonus checked");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.rejectedWith(EVMThrow);

        console.log("period 8 reverted (maximum 7 additional period!!!)");

        await increaseTimeTo(period.endTime + duration.seconds(100));

        await crowdsale.finalize()
          .should.be.fulfilled;

        console.log("finalized");

        const totalSupply = await token.totalSupply();
        const bountyAmount = totalSupply.mul(5).div(100);
        const partnersAmount = totalSupply.mul(15).div(100);
        const reserveAmount = totalSupply.mul(15).div(100);
        const teamAmount = totalSupply.mul(15).div(100);

        (await token.balanceOf(bountyAddress))
          .should.be.bignumber.equal(bountyAmount);
        (await token.balanceOf(partnersAddress))
          .should.be.bignumber.equal(partnersAmount);
        (await token.balanceOf(ATCReserveLocker.address))
          .should.be.bignumber.equal(reserveAmount);

        (await token.balanceOf(teamLocker.address))
          .should.be.bignumber.equal(teamAmount);

        (await token.controller())
          .should.be.equal(ATCController);

        const weiRaised = await crowdsale.weiRaised();

        weiRaised
          .should.be.bignumber.equal(cumulativeWeiRaised);

        for (const address of vaultOwner) {
          (await eth.getBalance(address))
            .should.be.bignumber.equal(weiRaised.div(10));
        }

        console.log("token & ether distribution checked");

        await ATCReserveLocker.release()
          .should.be.rejectedWith(EVMThrow);

        console.log("ATCReserveLocker release reverted before releaseTime");

        for (var i = 0; i < teamReleaseTimelines.length; i++) {
          await increaseTimeTo(teamReleaseTimelines[i] - duration.seconds(100));
          await teamLocker.release()
            .should.be.fulfilled;

          for (var j = 0; j < teamBeneficiaries.length; j++) {
            (await token.balanceOf(teamBeneficiaries[j]))
              .should.be.bignumber.equal(teamAmount.mul(teamReleaseRatios[i]).div(100).div(3))
          }

          console.log("teamLocker release %d (%d %)", i, teamReleaseRatios[i]);
        }

        await increaseTimeTo(teamReleaseTimelines[teamReleaseTimelines.length - 1] + duration.seconds(100));
        await teamLocker.release()
          .should.be.fulfilled;

        for (var j = 0; j < teamBeneficiaries.length; j++) {
          (await token.balanceOf(teamBeneficiaries[j]))
            .should.be.bignumber.equal(teamAmount.div(3))
        }

        console.log("teamLocker release 3 (100 %)");

        await ATCReserveLocker.release()
          .should.be.fulfilled;
        (await token.balanceOf(ATCReserveBeneficiary))
          .should.be.bignumber.equal(reserveAmount)

        console.log("ATCReserveLocker release (100 %)");

        await token.transfer(investor2, 100, { from: investor1 }).should.be.fulfilled;

        console.log("token transfer accepted");
      });
    });
  },
);
