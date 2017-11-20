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
      investor,
      bountyAddress0,
      bountyAddress1,
      bountyAddress2,
      reserveAddress0,
      reserveAddress1,
      reserveAddress2,
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

    let bountyAddresses, reserveAddresses;

    let registeredAddresses, unregisteredAddresses;

    const newOwner = accounts[ 25 ];

    const contractDeploy = async (logging = true) => {
      const logger = (...args) => (logging ? console.log(...args) : null);

      bountyAddresses = [
        bountyAddress0,
        bountyAddress1,
        bountyAddress2,
      ];

      reserveAddresses = [
        reserveAddress0,
        reserveAddress1,
        reserveAddress2,
      ];

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
      presaleRate = 200;

      multiSig = await MultiSig.new(bountyAddresses, bountyAddresses.length - 1);
      logger("multiSig deployed at", multiSig.address);

      tokenFactory = await MiniMeTokenFactory.new();
      logger("tokenFactory deployed at", tokenFactory.address);

      token = await ATC.new(tokenFactory.address);
      logger("token deployed at", token.address);

      vault = await RefundVault.new(multiSig.address, bountyAddresses);
      logger("vault deployed at", vault.address);

      /*eslint-disable */
      presale = await ATCPresale.new(
        token.address,
        vault.address,
        reserveAddresses,
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
      afterPresaleEndTime = presaleEndTime + duration.seconds(1);

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
        await contractDeploy(false);
        await increaseTimeTo(beforePresaleStartTime);

        const registerTx = await presale.register(investor, presaleMaxEtherCap)
          .should.be.fulfilled;
        console.log("presale registered");

        (await presale.registeredAddress(investor))
          .should.be.equal(true);

        await increaseTimeTo(afterPresaleStartTime);

        const purchaseTx = await presale.buyPresale(investor, { value: presaleMaxEtherCap, from: investor })
          .should.be.fulfilled;
        console.log("presale purchase");

        await increaseTimeTo(afterPresaleEndTime);

        // const finalizeTx = await presale.finalizePresale(crowdsale.address)
        //   .should.be.fulfilled;
        // // (await crowdsale.presaleFallBackCalled())
        // //   .should.be.equal(true);
        //
        // console.log("presale finalize");
        //
        // let period,
        //   periodIndex = 0;
        //
        // period = periods[ periodIndex++ ];
        // await increaseTimeTo(period.startTime - 1);
        // await crowdsale.startPeriod(period.startTime, period.endTime, period.rate);
        //   .should.be.fulfilled;
        //
        // period = periods[ 1 ];
        // await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
        //   .should.be.fulfilled;
        //
        // period = periods[ 2 ];
        // await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
        //   .should.be.fulfilled;
        //
        // period = periods[ 3 ];
        // await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
        //   .should.be.fulfilled;
        //
        // period = periods[ 4 ];
        // await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
        //   .should.be.fulfilled;
        //
        // period = periods[ 5 ];
        // await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
        //   .should.be.fulfilled;
        //
        // period = periods[ 6 ];
        // await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
        //   .should.be.fulfilled;
        //
        // period = periods[ 7 ];
        // await crowdsale.startPeriod(period.startTime, period.endTime, period.rate)
        //   .should.be.rejectedWith(EVMThrow);
      });
    });
  },
);
