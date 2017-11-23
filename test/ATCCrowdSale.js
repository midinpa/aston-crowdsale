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
const ATCCrowdSale = artifacts.require("ATCCrowdSale.sol");
const ATC = artifacts.require("ATC.sol");
const KYC = artifacts.require("KYC.sol");
const RefundVault = artifacts.require("vault/RefundVault.sol");
const MultiSig = artifacts.require("wallet/MultiSigWallet.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

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
      ATCBountyAddress0,
      ATCBountyAddress1,
      ATCBountyAddress2,
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
      ATCReserveLocker,
      teamLocker,
      ATCController,
      ...accounts
    ],
  ) => {
    let snapshotId;

    let presale, crowdsale, token, kyc, vault, multiSig, tokenFactory;

    let baseTime = moment();
    let now, presaleStartTime, presaleEndTime;
    let beforePresaleStartTime, afterPresaleEndTime, afterPresaleStartTime;
    let periods, baseRate, presaleRate;
    let additionalBonus1, additionalBonus2;
    let getAdditionalBonus, getRate, period, periodIndex;

    let maxEtherCap, minEtherCap, presaleMaxEtherCap;
    let maxGuaranteedLimit;

    let bountyAddresses, vaultOwner;

    let cumulativeWeiRaised;

    let registeredAddresses, unregisteredAddresses;

    const newOwner = accounts[ 25 ];

    const contractDeploy = async (logging = true) => {
      const logger = (...args) => (logging ? console.log(...args) : null);

      bountyAddresses = [
        ATCBountyAddress0,
        ATCBountyAddress1,
        ATCBountyAddress2,
      ];

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
      presaleMaxEtherCap = maxEtherCap.mul(15).div(100);
      maxGuaranteedLimit = ether(5000);

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
        new Period( // 1
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(15)
        ),
        new Period( // 2
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(10)
        ),
        new Period( // 3
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          new BigNumber(5)
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
      /* eslint-enable */

      multiSig = await MultiSig.new(bountyAddresses, bountyAddresses.length - 1);
      logger("multiSig deployed at", multiSig.address);

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
        presaleMaxEtherCap,
        presaleRate
      );
      /* eslint-enable */
      logger("presale deployed at", presale.address);

      await token.changeController(presale.address);
      await vault.transferOwnership(presale.address);

      kyc = await KYC.new();
      logger("kyc deployed at", kyc.address);

      /*eslint-disable */
      crowdsale = await ATCCrowdSale.new(
        kyc.address,
        token.address,
        vault.address,
        presale.address,
        bountyAddresses,
        multiSig.address,
        ATCReserveLocker,
        teamLocker,
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

        const registerTx = await presale.register(investor1, presaleMaxEtherCap)
          .should.be.fulfilled;
        console.log("presale registered");

        (await presale.registeredAddress(investor1))
          .should.be.equal(true);

        await increaseTimeTo(afterPresaleStartTime);

        const purchaseTx = await presale.buyPresale(investor1, {
          value: presaleMaxEtherCap,
          from: investor1,
        }).should.be.fulfilled;

        cumulativeWeiRaised = cumulativeWeiRaised.add(presaleMaxEtherCap);

        (await token.balanceOf(investor1))
          .should.be.bignumber.equal(presaleMaxEtherCap.mul(presaleRate));
        console.log("presale purchase");

        await increaseTimeTo(afterPresaleEndTime);

        const finalizeTx = await presale.finalizePresale(crowdsale.address)
          .should.be.fulfilled;
        (await crowdsale.presaleFallBackCalled())
          .should.be.equal(true);
        console.log("presale finalize");

        await kyc.registerByList([ investor1, investor2 ])
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

        investAmount = ether(1);

        await crowdsale.buy(investor2, {
          from: investor2,
          value: investAmount,
        }).should.be.fulfilled;
        cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

        (await token.balanceOf(investor2))
          .should.be.bignumber.equal(
            investAmount.mul(getRate(investAmount)));
        // investAmount.mul(baseRate.mul(period.bonus.add(100).div(100))));

        investAmount = ether(300);

        await crowdsale.buy(investor2, {
          from: investor2,
          value: investAmount,
        }).should.be.fulfilled;
        cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

        console.log("investor2 buy tokens");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));

        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 1 startred");

        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        await increaseTimeTo(period.startTime + duration.seconds(100));

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

        console.log("many investors purchased");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));
        await crowdsale.startPeriod(period.startTime, period.endTime)
          .should.be.fulfilled;

        console.log("period 2 startred");

        (await crowdsale.getBonus())
          .should.be.bignumber.equal(period.bonus);

        await increaseTimeTo(period.startTime + duration.seconds(100));

        const investor3 = accounts[ 11 ];
        const investAmount3 = ether(100);

        await kyc.register(investor3)
          .should.be.fulfilled;

        await crowdsale.buy(investor3, {
          from: investor3,
          value: investAmount3,
        }).should.be.fulfilled;
        cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount3);

        (await token.balanceOf(investor3))
          .should.be.bignumber.equal(investAmount3.mul(getRate(investAmount3)));

        await token.transfer(investor2, 100, { from: investor1 })
          .should.be.rejectedWith(EVMThrow);

        console.log("token transfer rejected");

        await increaseTimeTo(period.endTime + duration.seconds(100));

        await crowdsale.finalize()
          .should.be.fulfilled;

        console.log("finalized");

        const totalSupply = await token.totalSupply();
        const bountyAndCommunityAmountForEach = totalSupply.mul(5).div(100);
        const reserverAmount = totalSupply.mul(15).div(100);
        const teamAmount = totalSupply.mul(15).div(100);

        for (const address of [ ATCBountyAddress0, ATCBountyAddress1, ATCBountyAddress2, multiSig.address ]) {
          (await token.balanceOf(address))
            .should.be.bignumber.equal(bountyAndCommunityAmountForEach);
        }

        (await token.balanceOf(ATCReserveLocker))
          .should.be.bignumber.equal(reserverAmount);

        (await token.balanceOf(teamLocker))
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

        await token.transfer(investor2, 100, { from: investor1 }).should.be.fulfilled;

        console.log("token transfer accepted");
      });
    });
  },
);
