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

contract(
  "ATCPresale",
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

    let tokenFactory, presale, token, vault;

    let now, startTime, endTime;
    let beforeStartTime, afterEndTime, afterStartTime;

    let rate;

    let maxEtherCap;

    let vaultOwner;

    before(async () => {
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

      startTime = moment().add(20, "minutes").unix();
      endTime = moment().add(100, "minutes").unix();

      const baseRate = new BigNumber(1500);
      rate = baseRate.mul(1.30); // 30% bonus for presale

      maxEtherCap = ether(286000);

      tokenFactory = await MiniMeTokenFactory.new();
      console.log("tokenFactory deployed at", tokenFactory.address);

      token = await ATC.new(tokenFactory.address);
      console.log("token deployed at", token.address);

      vault = await RefundVault.new(vaultOwner);
      console.log("vault deployed at", vault.address);


      /*eslint-disable */
      presale = await ATCPresale.new(
        token.address,
        vault.address,
        startTime,
        endTime,
        maxEtherCap,
        rate
      );
      /*eslint-enable */
      console.log("presale deployed at", presale.address);

      await token.changeController(presale.address);
      await vault.transferOwnership(presale.address);

      // backup
      snapshotId = await capture();

      now = moment().unix();

      beforeStartTime = startTime - duration.seconds(100);
      afterStartTime = startTime + duration.seconds(1);
      afterEndTime = endTime + duration.seconds(1);

      console.log(`
------------------------------

\t[TIME]
startTime:\t\t${ startTime }
endTime:\t\t${ endTime }

beforeStartTime:\t${ beforeStartTime }
afterStartTime:\t\t${ afterStartTime }
afterEndTime:\t\t${ afterEndTime }

now:\t\t\t${ now }

------------------------------
`);
    });

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

    describe("ATCPresale Test", async () => {
      // before start//
      // /////////////
      it("should reject payments before start", async () => {
        await increaseTimeTo(beforeStartTime);

        const registerPresaleTx = await presale.register(investor1, ether(1))
          .should.be.fulfilled;

        (await presale.registeredAddress(investor1)).should.be.equal(true);

        await presale
          .buyPresale(investor1, { from: investor1, value: ether(1) })
          .should.be.rejectedWith(EVMThrow);

        console.log("registerPresale Gas Used :", registerPresaleTx.receipt.gasUsed);
      });// end "should reject payments before start"

      it("register and unregister presale", async () => {
        const registeredAmount = ether(5000);

        await presale.register(
          investor1,
          registeredAmount,
        ).should.be.fulfilled;

        (await presale.registeredAddress(investor1)).should.be.equal(true);

        (await presale.presaleGuaranteedLimit(investor1))
          .should.be.bignumber.equal(registeredAmount);

        await presale.register(
          investor1,
          registeredAmount,
        ).should.be.rejectedWith(EVMThrow);

        // unregister
        const unregisterPresaleTx = await presale.unregister(investor1)
          .should.be.fulfilled;

        (await presale.presaleGuaranteedLimit(investor1))
          .should.be.bignumber.equal(new BigNumber(0));

        console.log("unregisterPresale Gas Used :", unregisterPresaleTx.receipt.gasUsed);
      }); // end "register and unregister presale"

      it("register and unregister by list presale", async () => {
        const registeredAmounts = new Array(10);
        const registeredAmount = ether(100);

        for (let i = 0; i < 10; i++) {
          registeredAmounts[ i ] = registeredAmount;
        }

        const registerByList10Tx = await presale.registerByList(
          accounts.slice(0, 10),
          registeredAmounts,
        ).should.be.fulfilled;

        for (const account of accounts.slice(0, 10)) {
          (await presale.registeredAddress(account)).should.be.equal(true);
          (await presale.presaleGuaranteedLimit(account))
            .should.be.bignumber.equal(registeredAmount);
        }

        const unregisterByList10Tx = await presale.unregisterByList(accounts.slice(0, 10))
          .should.be.fulfilled;

        for (const account of accounts.slice(0, 10)) {
          (await presale.registeredAddress(account)).should.be.equal(false);
          (await presale.presaleGuaranteedLimit(account))
            .should.be.bignumber.equal(new BigNumber(0));
        }

        console.log("registerByList10Tx Gas Used :", registerByList10Tx.receipt.gasUsed);
        console.log("unregisterByList10Tx Gas Used :", unregisterByList10Tx.receipt.gasUsed);
      }); // end "register and unregister by list presale"

      it("register by list presale test", async () => {
        const registeredAmounts = new Array(40);
        const registeredAmount = ether(100);

        for (let i = 0; i < 40; i++) {
          registeredAmounts[ i ] = registeredAmount;
        }

        const registerByList40Tx = await presale.registerByList(
          accounts.slice(0, 40),
          registeredAmounts,
        ).should.be.fulfilled;

        for (const account of accounts.slice(0, 40)) {
          (await presale.registeredAddress(account)).should.be.equal(true);
          (await presale.presaleGuaranteedLimit(account))
            .should.be.bignumber.equal(registeredAmount);
        }

        console.log("registerByList40Tx Gas Used :", registerByList40Tx.receipt.gasUsed);
      }); // end "register and unregister by list presale"


      // after start//
      // /////////////
      it("should buy presaled amount", async () => {
        await increaseTimeTo(afterStartTime);
        const presaledAmount = ether(5000);
        const investedAmount = ether(6000);

        await presale.register(
          investor1,
          presaledAmount,
        ).should.be.fulfilled;

        const balanceBeforeInvest = await eth.getBalance(investor1);

        const buyPresaleTx = await presale.buyPresale(investor1, {
          value: investedAmount,
          from: investor1,
        }).should.be.fulfilled;

        const balanceAfterInvest = await eth.getBalance(investor1);

        const expectedTokenAmount = presaledAmount.mul(rate);

        (await token.balanceOf(investor1))
          .should.be.bignumber.equal(expectedTokenAmount);

        (await token.totalSupply())
          .should.be.bignumber.equal(expectedTokenAmount);

        (balanceBeforeInvest - balanceAfterInvest).should.be.within(
          presaledAmount.toNumber(),
          presaledAmount.add(ether(1)).toNumber(),
        );

        const vaultEtherAmount = await eth.getBalance(vault.address);
        vaultEtherAmount.should.be.bignumber.equal(presaledAmount);

        await token.transfer(accounts[ 1 ], 100, { from: investor1 })
          .should.be.rejectedWith(EVMThrow);

        console.log("buyPresale Gas Used :", buyPresaleTx.receipt.gasUsed);
      }); // end "should buy presaled amount"


      it("not registered investor3 should be rejected", async () => {
        const investedAmount = ether(5000);

        await presale.buyPresale(investor3, {
          value: investedAmount,
          from: investor3,
        }).should.be.rejectedWith(EVMThrow);
      }); // end "not registered investor1 should be rejected"

    });
  },
);
