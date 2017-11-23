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
const MultiSig = artifacts.require("wallet/MultiSigWallet.sol");
const MiniMeTokenFactory = artifacts.require("token/MiniMeTokenFactory.sol");

contract(
  "ATCPresale",
  async (
    [
      owner,
      investor,
      ,
      ,
      ,
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
      ,
      ,
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

    const newOwner = accounts[ 25 ];

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

      startTime = moment().add(5, "minutes").unix();
      endTime = moment().add(20, "minutes").unix();

      rate = 200;
      maxEtherCap = ether(10000);

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

        const registerPresaleTx = await presale.register(investor, ether(1))
          .should.be.fulfilled;

        (await presale.registeredAddress(investor)).should.be.equal(true);

        await presale.send(ether(1), { from: investor })
          .should.be.rejectedWith(EVMThrow);

        await presale
          .buyPresale(investor, { from: investor, value: ether(1) })
          .should.be.rejectedWith(EVMThrow);

        console.log("registerPresale Gas Used :", registerPresaleTx.receipt.gasUsed);
      });// end "should reject payments before start"

      it("register and unregister presale", async () => {
        const registeredAmount = ether(5000);

        await presale.register(
          investor,
          registeredAmount,
        ).should.be.fulfilled;

        (await presale.registeredAddress(investor)).should.be.equal(true);

        (await presale.presaleGuaranteedLimit(investor))
          .should.be.bignumber.equal(registeredAmount);

        await presale.register(
          investor,
          registeredAmount,
        ).should.be.rejectedWith(EVMThrow);

        // unregister
        const unregisterPresaleTx = await presale.unregister(investor)
          .should.be.fulfilled;

        (await presale.presaleGuaranteedLimit(investor))
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

      it("excessive register should be rejected", async () => {
        const registeredAmount = ether(12000);

        await presale.register(
          investor,
          registeredAmount,
        ).should.be.rejectedWith(EVMThrow);

        (await presale.registeredAddress(investor)).should.be.equal(false);

        (await presale.presaleGuaranteedLimit(investor))
          .should.be.bignumber.equal(new BigNumber(0));
      }); // end "excessive register should be rejected"

      it("excessive register by list should be rejected", async () => {
        const registeredAmounts = new Array(10);
        const registeredAmount = ether(1200);

        for (let i = 0; i < 10; i++) {
          registeredAmounts[ i ] = registeredAmount;
        }

        const registerByList10Tx = await presale.registerByList(
          accounts.slice(0, 10),
          registeredAmounts,
        ).should.be.rejectedWith(EVMThrow);

        for (const account of accounts.slice(0, 10)) {
          (await presale.registeredAddress(account)).should.be.equal(false);
          (await presale.presaleGuaranteedLimit(account))
            .should.be.bignumber.equal(new BigNumber(0));
        }
      }); // end "excessive registerby list should be rejected"

      // after start//
      // /////////////
      it("should buy presaled amount", async () => {
        await increaseTimeTo(afterStartTime);
        const presaledAmount = ether(5000);
        const investedAmount = ether(6000);

        const excessivePresaledAmount = ether(6000);

        await presale.register(
          investor,
          presaledAmount,
        ).should.be.fulfilled;

        await presale.register(
          accounts[ 0 ],
          excessivePresaledAmount,
        ).should.be.rejectedWith(EVMThrow);

        await presale.register(
          accounts[ 0 ],
          presaledAmount,
        ).should.be.fulfilled;

        const balanceBeforeInvest = await eth.getBalance(investor);
        const balanceBeforeInvest2 = await eth.getBalance(accounts[ 0 ]);

        const buyPresaleTx = await presale.buyPresale(investor, {
          value: investedAmount,
          from: investor,
        }).should.be.fulfilled;

        await presale.buyPresale(accounts[ 0 ], {
          value: investedAmount,
          from: accounts[ 0 ],
        }).should.be.fulfilled;

        const balanceAfterInvest = await eth.getBalance(investor);
        const balanceAfterInvest2 = await eth.getBalance(accounts[ 0 ]);

        const expectedTokenAmount = presaledAmount.mul(rate);
        const totalExpectedTokenAmount = expectedTokenAmount.mul(2);

        (await token.balanceOf(investor))
          .should.be.bignumber.equal(expectedTokenAmount);
        (await token.balanceOf(accounts[ 0 ]))
          .should.be.bignumber.equal(expectedTokenAmount);

        (await token.totalSupply())
          .should.be.bignumber.equal(totalExpectedTokenAmount);
        (balanceBeforeInvest - balanceAfterInvest).should.be.within(
          presaledAmount.toNumber(),
          presaledAmount.add(ether(1)).toNumber(),
        );
        (balanceBeforeInvest2 - balanceAfterInvest2).should.be.within(
          presaledAmount.toNumber(),
          presaledAmount.add(ether(1)).toNumber(),
        );

        const vaultEtherAmount = await eth.getBalance(vault.address);
        vaultEtherAmount.should.be.bignumber.equal(maxEtherCap);

        await token.transfer(accounts[ 1 ], 100, { from: investor })
          .should.be.rejectedWith(EVMThrow);

        console.log("buyPresale Gas Used :", buyPresaleTx.receipt.gasUsed);
      }); // end "should buy presaled amount"

      it("not registered investor should be rejected", async () => {
        const investedAmount = ether(5000);

        await presale.buyPresale(accounts[ 0 ], {
          value: investedAmount,
          from: accounts[ 0 ],
        }).should.be.rejectedWith(EVMThrow);
      }); // end "not registered investor should be rejected"

      it("unregister already funded investor should be rejected", async () => {
        const registeredAmount = ether(5000);

        await presale.register(
          investor,
          registeredAmount,
        ).should.be.fulfilled;

        (await presale.registeredAddress(investor)).should.be.equal(true);

        (await presale.presaleGuaranteedLimit(investor))
          .should.be.bignumber.equal(registeredAmount);

        await presale.buyPresale(investor, {
          value: ether(1),
          from: investor,
        }).should.be.fulfilled;

        const unregisterPresaleTx = await presale.unregister(investor)
          .should.be.rejectedWith(EVMThrow);
      }); // end "unregister already funded investor should be rejected"

      it("unregister already funded investor by list should be rejected", async () => {
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

        await presale.buyPresale(accounts[ 1 ], {
          value: ether(1),
          from: accounts[ 1 ],
        }).should.be.fulfilled;

        // unregister
        const unregisterByList10Tx = await presale.unregisterByList(accounts.slice(0, 10))
          .should.be.rejectedWith(EVMThrow);
      }); // end "unregister already funded investor by list should be rejected"

      it("finalizePresale should be rejected before endTime", async () => {
        await presale.finalizePresale(newOwner)
          .should.be.rejectedWith(EVMThrow);
      }); // end "should finalizePresale"

      // after end//
      // /////////////
      it("should finalizePresale", async () => {
        const presaledAmount = ether(5000);
        const investedAmount = ether(5000);

        await presale.register(
          investor,
          presaledAmount,
        ).should.be.fulfilled;

        await presale.buyPresale(investor, {
          value: investedAmount,
          from: investor,
        }).should.be.fulfilled;

        await increaseTimeTo(afterEndTime);
        const finalizePresaleTx = await presale.finalizePresale(newOwner)
          .should.be.fulfilled;

        (await vault.owner()).should.be.equal(newOwner);
        (await token.controller()).should.be.equal(newOwner);

        await token.enableTransfers(true, { from: newOwner }).should.be.fulfilled;
        await token.transfer(accounts[ 1 ], 100, { from: investor })
          .should.be.fulfilled;

        console.log("finalizePresale Gas Used :", finalizePresaleTx.receipt.gasUsed);
      }); // end "should finalizePresale"
    });
  },
);
