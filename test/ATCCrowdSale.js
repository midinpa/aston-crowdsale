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
const RefundVault = artifacts.require("crowdsale/RefundVault.sol");
const MultiSig = artifacts.require("wallet/MultiSigWallet.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

class Period {
  constructor(startTime, endTime, rate) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.rate = rate;
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
      ATCReserveAddress,
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
      teamAddress,
      ATCController,
      ...accounts
    ],
  ) => {
    let snapshotId;

    let presale, crowdsale, token, kyc, vault, multiSig, tokenFactory;

    let baseTime = moment();
    let now, presaleStartTime, presaleEndTime;
    let beforePresaleStartTime, afterPresaleEndTime, afterPresaleStartTime;
    let periods, presaleRate;

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

      /*eslint-disable */
      periods = [
        new Period(
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          240
        ),
        new Period(
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          230
        ),
        new Period(
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          220
        ),
        new Period(
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          210
        ),
        new Period(
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          200
        ),
        new Period(
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          200
        ),
        new Period(
          baseTime.add(5, "minutes").unix(),
          baseTime.add(5, "minutes").unix(),
          200
        ),
      ];
      /* eslint-enable */

      maxEtherCap = ether(286000);
      minEtherCap = ether(28600);
      presaleMaxEtherCap = maxEtherCap.mul(15).div(100);
      maxGuaranteedLimit = ether(5000);

      presaleRate = 200;

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
        ATCReserveAddress,
        teamAddress,

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
          value: ether(1),
        }).should.be.rejectedWith(EVMThrow);
        console.log("reject purchase before period");

        let period,
          periodIndex = 0;

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));

        await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
          .should.be.fulfilled;
        console.log("period 0 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));

        await crowdsale.buy(investor2, {
          from: investor2,
          value: maxGuaranteedLimit,
        }).should.be.fulfilled;
        cumulativeWeiRaised = cumulativeWeiRaised.add(maxGuaranteedLimit);
        console.log("investor2 buy tokens");

        period = periods[ periodIndex++ ];
        await increaseTimeTo(period.startTime - duration.seconds(100));

        await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
          .should.be.fulfilled;
        console.log("period 1 startred");

        await increaseTimeTo(period.startTime + duration.seconds(100));

        // // accept purchase by many investors
        const investors = accounts.slice(0, 10);
        await kyc.registerByList(investors)
          .should.be.fulfilled;

        for (const investor of investors) {
          if (await crowdsale.maxReached()) {
            break;
          }

          const investAmount = maxGuaranteedLimit;

          await crowdsale.buy(investor, {
            from: investor,
            value: investAmount,
          }).should.be.fulfilled;
          cumulativeWeiRaised = cumulativeWeiRaised.add(investAmount);

          (await token.balanceOf(investor))
            .should.be.bignumber.equal(investAmount.mul(period.rate));
        }

        console.log("many investors purchased");

        await token.transfer(investor2, 100, { from: investor1 }).should.be.rejectedWith(EVMThrow);

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
          (await token.balanceOf(address)).should.be.bignumber.equal(bountyAndCommunityAmountForEach);
        }

        (await token.balanceOf(ATCReserveAddress)).should.be.bignumber.equal(reserverAmount);

        (await token.balanceOf(teamAddress)).should.be.bignumber.equal(teamAmount);

        (await token.controller()).should.be.equal(ATCController);

        const weiRaised = await crowdsale.weiRaised();
        weiRaised
          .should.be.bignumber.equal(cumulativeWeiRaised);

        for (const address of vaultOwner) {
          (await eth.getBalance(address)).should.be.bignumber.equal(weiRaised.div(10));
        }

        console.log("token & ether distribution checked");

        await token.transfer(investor2, 100, { from: investor1 }).should.be.fulfilled;

        console.log("token transfer accepted");
      });
    });
  },
);
