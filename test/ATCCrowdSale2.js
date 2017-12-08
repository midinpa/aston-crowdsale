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

  const ATCCrowdSale = artifacts.require("ATCCrowdSale2.sol");
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
    let additionalBonuses;
    let finalBonuses;
    let getAdditionalBonus, getRate, period, periodIndex;

    let maxEtherCap, minEtherCap;

    let vaultOwner;

    let cumulativeWeiRaised;

    let ATCReserveLocker, teamLocker;
    let ATCReserveReleaseTime, teamReleaseTimelines, teamReleaseRatios;
    let teamBeneficiaries;

    let additionalBonusAmounts;
    let investAmount;

    let firstPeriodStartTime, firstPeriodEndTime;
    let additionalPeriodStartTime1, additionalPeriodEndTime1;
    let additionalPeriodStartTime2, additionalPeriodEndTime2;
    let additionalPeriodStartTime3, additionalPeriodEndTime3;
    let additionalPeriodStartTime4, additionalPeriodEndTime4;
    let additionalPeriodStartTime5, additionalPeriodEndTime5;
    let additionalPeriodStartTime6, additionalPeriodEndTime6;
    let additionalPeriodStartTime7, additionalPeriodEndTime7;

    getAdditionalBonus = (amount) => {
      if (amount.gte(ether(6000))) return additionalBonuses[1];
      else if (amount.gte(ether(300))) return additionalBonuses[0];
      return new BigNumber(0);
    };

    getRate = (amount) => {
      let bonus = new BigNumber(0);

      if (amount.gte(additionalBonusAmounts[3])) bonus = finalBonuses[1];
      else if (amount.gte(additionalBonusAmounts[2])) bonus = finalBonuses[0];
      else {
        bonus = period.bonus.add(getAdditionalBonus(amount));
      }
      return baseRate.mul(bonus.add(100).div(100));
    };

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

      maxEtherCap = ether(286000);
      minEtherCap = ether(28600);

      baseRate = new BigNumber(1500);

      additionalBonuses = [
        new BigNumber(5), // 5% bonus for more than 300 ETH
        new BigNumber(10) // 10% bonus for more than 6000 ETH
      ];

      finalBonuses = [
        new BigNumber(25),
        new BigNumber(30),
      ];

      additionalBonusAmounts = [
        ether(300),
        ether(6000),
        ether(8000),
        ether(10000)
      ]

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

      /*eslint-disable */
      periods = [
        new Period( // 0
          firstPeriodStartTime,
          firstPeriodEndTime,
          new BigNumber(15)
        ),
        new Period( // 1
          additionalPeriodStartTime1,
          additionalPeriodEndTime1,
          new BigNumber(10)
        ),
        new Period( // 2
          additionalPeriodStartTime2,
          additionalPeriodEndTime2,
          new BigNumber(5)
        ),
        new Period( // 3
          additionalPeriodStartTime3,
          additionalPeriodEndTime3,
          new BigNumber(0)
        ),
        new Period( // 4
          additionalPeriodStartTime4,
          additionalPeriodEndTime4,
          new BigNumber(0)
        ),
        new Period( // 5
          additionalPeriodStartTime5,
          additionalPeriodEndTime5,
          new BigNumber(0)
        ),
        new Period( // 6
          additionalPeriodStartTime6,
          additionalPeriodEndTime6,
          new BigNumber(0)
        ),
        new Period( // 7
          additionalPeriodStartTime7,
          additionalPeriodEndTime7,
          new BigNumber(0)
        )
      ];

      teamReleaseRatios = [
        20,
        50
      ];

      teamBeneficiaries = [
        teamBeneficiary0,
        teamBeneficiary1,
        teamBeneficiary2
      ];

      /* eslint-enable */
      tokenFactory = await MiniMeTokenFactory.new();
      logger("tokenFactory deployed at", tokenFactory.address);

      token = await ATC.new(tokenFactory.address);
      logger("token deployed at", token.address);

      vault = await RefundVault.new(vaultOwner);
      logger("vault deployed at", vault.address);

      // //////////////
      // PRESALE DONE//
      // //////////////

      kyc = await KYC.new();
      logger("kyc deployed at", kyc.address);

      crowdsale = await ATCCrowdSale.new();
      logger("crowdsale deployed at", crowdsale.address);

      ATCReserveLocker = await ReserveLocker.new(
        token.address,
        crowdsale.address,
        ATCReserveBeneficiary
      );
      logger("ATCReserveLocker deployed at", ATCReserveLocker.address);
      teamLocker = await TeamLocker.new(
        token.address,
        crowdsale.address,
        teamBeneficiaries
      );
      logger("teamLocker deployed at", teamLocker.address);

      await token.changeController(crowdsale.address);
      await vault.transferOwnership(crowdsale.address);

      await crowdsale.initialize(
        kyc.address,
        token.address,
        vault.address,
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

      logger("crowdsale initialized")

      for (let i = 0; i < periods.length; i++) {
        period = periods[i];

        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period %d startred", i);
      }


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

    const checkInvestingForEachPeriod = async (period_num) => {
      period = periods[ period_num ];

      await increaseTimeTo(period.startTime + duration.seconds(100));
      (await crowdsale.getPeriodBonus())
        .should.be.bignumber.equal(period.bonus);

      const current_nonce = await web3.eth.getTransactionCount(investor1);
      console.log('current_nonce :', current_nonce);

      console.log("period %d bonus checked", period_num);

      investAmount = ether(1);

      console.log(await crowdsale.calculateRate(investAmount));

      let investor1totalToken = await token.balanceOf(investor1);

      await crowdsale.buy(investor1, {
        from: investor1,
        value: investAmount,
        nonce: current_nonce
      }).should.be.fulfilled;

      cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

      (await token.balanceOf(investor1))
        .should.be.bignumber.equal(
          investor1totalToken.add(investAmount.mul(getRate(investAmount))));

      console.log("period %d: investor1 buy tokens(1 ether) at rate %d", period_num, getRate(investAmount));

      investAmount = ether(300);

      let investor2totalToken = await token.balanceOf(investor2);

      console.log(await crowdsale.calculateRate(investAmount));
      await crowdsale.buy(investor2, {
        from: investor2,
        value: investAmount,
      }).should.be.fulfilled;
      cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

      (await token.balanceOf(investor2))
        .should.be.bignumber.equal(
          investor2totalToken.add(investAmount.mul(getRate(investAmount))));

      console.log("period %d: investor2 buy tokens(300 ether) at rate %d", period_num, getRate(investAmount));

      investAmount = ether(6000);

      let investor3totalToken = await token.balanceOf(investor3);

      console.log(await crowdsale.calculateRate(investAmount));
      await crowdsale.buy(investor3, {
        from: investor3,
        value: investAmount,
      }).should.be.fulfilled;
      cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

      (await token.balanceOf(investor3))
        .should.be.bignumber.equal(
          investor3totalToken.add(investAmount.mul(getRate(investAmount))));

      console.log("period %d: investor3 buy tokens(6000 ether) at rate %d", period_num, getRate(investAmount));

      investAmount = ether(8000);

      let investor4totalToken = await token.balanceOf(investor4);

      console.log(await crowdsale.calculateRate(investAmount));
      await crowdsale.buy(investor4, {
        from: investor4,
        value: investAmount,
      }).should.be.fulfilled;
      cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

      (await token.balanceOf(investor4))
        .should.be.bignumber.equal(
          investor4totalToken.add(investAmount.mul(getRate(investAmount))));

      console.log("period %d: investor4 buy tokens(8000 ether) at rate %d", period_num, getRate(investAmount));

      investAmount = ether(10000);

      console.log(await crowdsale.calculateRate(investAmount));
      let investor5totalToken = await token.balanceOf(investor5);

      await crowdsale.buy(investor5, {
        from: investor5,
        value: investAmount,
      }).should.be.fulfilled;
      cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

      (await token.balanceOf(investor5))
        .should.be.bignumber.equal(
          investor5totalToken.add(investAmount.mul(getRate(investAmount))));

      console.log("period %d: investor5 buy tokens(10000 ether) at rate %d", period_num, getRate(investAmount));
    }

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

        cumulativeWeiRaised = new BigNumber(0);

        await kyc.registerByList([ investor1, investor2, investor3, investor4, investor5 ])
          .should.be.fulfilled;
        console.log("kyc register");

        // reject purchase before period started
        await crowdsale.buy(investor1, {
          from: investor1,
          value: ether(10),
        }).should.be.rejectedWith(EVMThrow);
        console.log("reject purchase before period");

        for (let i = 0; i < periods.length; i++) {
          await checkInvestingForEachPeriod(i);

          if (i == 7) {
            ///invest to maxEthercap
            const tmp_weiRaised = await crowdsale.weiRaised();
            investAmount = maxEtherCap.sub(tmp_weiRaised).add(ether(5));
            const investedAmount = maxEtherCap.sub(tmp_weiRaised);

            let investor1totalToken = await token.balanceOf(investor1);

            let invertor1BeforeBalance = await eth.getBalance(investor1);

            await crowdsale.buy(investor1, {
              from: investor1,
              value: investAmount,
            }).should.be.fulfilled;

            let invertor1AfterBalance = await eth.getBalance(investor1);

            invertor1BeforeBalance.sub(invertor1AfterBalance).toNumber().should.be.within(
              investedAmount.toNumber(),
              investedAmount.add(ether(1)).toNumber()
            )

            cumulativeWeiRaised = cumulativeWeiRaised.add(investedAmount);

            (await token.balanceOf(investor1))
              .should.be.bignumber.equal(
                investor1totalToken.add(investedAmount.mul(getRate(investedAmount))));

            console.log("period %d investor1 invested over maxEtherCap and the toReturn came back", i);
          }
        }

        await increaseTimeTo(periods[periods.length - 1].endTime + duration.seconds(100));

        await crowdsale.finalize()
          .should.be.fulfilled;

        (await crowdsale.finalizedTime())
          .should.be.bignumber.gt(new BigNumber(0));

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

        //Locker Test

        await ATCReserveLocker.release()
          .should.be.rejectedWith(EVMThrow);

        console.log("ATCReserveLocker release reverted before releaseTime");

        await teamLocker.release()
          .should.be.fulfilled;

        for (var j = 0; j < teamBeneficiaries.length; j++) {
          (await token.balanceOf(teamBeneficiaries[j]))
            .should.be.bignumber.equal(teamAmount.mul(teamReleaseRatios[0]).div(100).div(3))
        }

        console.log("teamLocker release 0 (%d %)", teamReleaseRatios[0]);

        await increaseTimeTo((await crowdsale.finalizedTime()).add(duration.days(184)));

        await teamLocker.release()
          .should.be.fulfilled;

        for (var j = 0; j < teamBeneficiaries.length; j++) {
          (await token.balanceOf(teamBeneficiaries[j]))
            .should.be.bignumber.equal(teamAmount.mul(teamReleaseRatios[1]).div(100).div(3))
        }

        console.log("teamLocker release 1 (%d %)", teamReleaseRatios[1]);

        await increaseTimeTo((await crowdsale.finalizedTime()).add(duration.days(368)));

        await teamLocker.release()
          .should.be.fulfilled;

        for (var j = 0; j < teamBeneficiaries.length; j++) {
          (await token.balanceOf(teamBeneficiaries[j]))
            .should.be.bignumber.equal(teamAmount.div(3))
        }

        console.log("teamLocker release 2 (%d %)", 100);

        await increaseTimeTo((await crowdsale.finalizedTime()).add(duration.days(731)));

        await ATCReserveLocker.release()
          .should.be.fulfilled;
        (await token.balanceOf(ATCReserveBeneficiary))
          .should.be.bignumber.equal(reserveAmount)

        console.log("ATCReserveLocker release (100 %)");

        await token.transfer(investor2, 100, { from: investor1 }).should.be.fulfilled;

        console.log("token transfer accepted");

        await token.generateTokens(investor2, 10, {from: ATCController})
          .should.be.rejectedWith(EVMThrow);

        console.log("token generation rejected");

        await token.blacklistAccount(investor2, {from: ATCController})
          .should.be.fulfilled;

        await token.transfer(investor1, 100, { from: investor2 })
          .should.be.rejectedWith(EVMThrow);

        console.log("token investor2 blacklisted");

        await token.unBlacklistAccount(investor2, {from: ATCController})
          .should.be.fulfilled;

        await token.transfer(investor1, 100, { from: investor2 })
          .should.be.fulfilled;

        console.log("token investor2 unblacklisted");

        console.log((await crowdsale.finalizedTime()).add(11 * 60));

      });

      // it("Refund Test", async () => {
      //
      //   await increaseTimeTo(beforePresaleStartTime);
      //
      //   investAmount = ether(1000);
      //   let presaleInvestor = accounts[0];
      //   const registerTx = await presale.register(presaleInvestor, investAmount)
      //     .should.be.fulfilled;
      //   console.log("presale registered");
      //
      //   (await presale.registeredAddress(presaleInvestor))
      //     .should.be.equal(true);
      //
      //   await increaseTimeTo(afterPresaleStartTime);
      //
      //   const purchaseTx = await presale.buyPresale(presaleInvestor, {
      //     value: investAmount,
      //     from: presaleInvestor,
      //   }).should.be.fulfilled;
      //
      //   cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);
      //
      //   (await token.balanceOf(presaleInvestor))
      //     .should.be.bignumber.equal(investAmount.mul(presaleRate));
      //   console.log("presale purchase");
      //
      //   await increaseTimeTo(afterPresaleEndTime);
      //
      //   const finalizeTx = await presale.finalizePresale(crowdsale.address)
      //     .should.be.fulfilled;
      //   (await crowdsale.presaleFallBackCalled())
      //     .should.be.equal(true);
      //   console.log("presale finalize");
      //
      //   await increaseTimeTo(periods[periods.length - 1].startTime + duration.seconds(100));
      //
      //   await crowdsale.finalize()
      //     .should.be.fulfilled;
      //
      //   console.log("finalized");
      //
      //   let presaleInvestorBeforeBalance = await eth.getBalance(presaleInvestor);
      //
      //   await crowdsale.claimRefund(presaleInvestor, {
      //     from: presaleInvestor
      //   }).should.be.fulfilled;
      //
      //   console.log("refund claimed");
      //
      //   let presaleInvestorAfterBalance = await eth.getBalance(presaleInvestor);
      //
      //   presaleInvestorAfterBalance.sub(presaleInvestorBeforeBalance).toNumber()
      //     .should.be.within(
      //       investAmount.sub(ether(1)).toNumber(),
      //       investAmount.toNumber()
      //     );
      // });
  });
});
