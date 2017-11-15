import ether from "./helpers/ether";
import { advanceBlock } from "./helpers/advanceToBlock";
import increaseTime, { increaseTimeTo, duration } from "./helpers/increaseTime";
import latestTime from "./helpers/latestTime";
import EVMThrow from "./helpers/EVMThrow";
import { capture, restore } from "./helpers/snapshot";
import timer from "./helpers/timer";

const BigNumber = web3.BigNumber;
const eth = web3.eth;

const should = require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

const KYC = artifacts.require("KYC.sol");

contract("KYC", async ([ owner, , , , , , , , ...accounts ]) => {
  let kyc;

  const idx0 = 0;
  const idx1 = accounts.length * 1 / 6;
  const idx2 = accounts.length * 2 / 6;
  const idx3 = accounts.length * 3 / 6;
  const idx4 = accounts.length * 4 / 6;
  const idx5 = accounts.length * 5 / 6;
  const idx6 = accounts.length - 3;
  const idx7 = accounts.length - 2;
  const newAdmin = accounts.length - 1;

  beforeEach(async () => {
    kyc = await KYC.new();
  });

  it("should register new user", async () => {
    for (const account of accounts.slice(0, idx0)) {
      (await kyc.registeredAddress(account))
        .should.be.equal(false);

      const r = await kyc.register(account)
        .should.be.fulfilled;

      (await kyc.registeredAddress(account))
        .should.be.equal(true);
    }
  });

  it("should unregister user", async () => {
    for (const account of accounts.slice(idx3, idx4)) {
      (await kyc.registeredAddress(account))
        .should.be.equal(false);

      await kyc.register(account)
        .should.be.fulfilled;

      (await kyc.registeredAddress(account))
        .should.be.equal(true);

      await kyc.unregister(account)
        .should.be.fulfilled;

      (await kyc.registeredAddress(account))
        .should.be.equal(false);
    }
  });

  it("should register new user by list", async () => {
    for (const account of accounts.slice(idx4, idx5)) {
      (await kyc.registeredAddress(account))
        .should.be.equal(false);
    }
    await kyc.registerByList(accounts.slice(idx4, idx5));

    for (const account of accounts.slice(idx4, idx5)) {
      (await kyc.registeredAddress(account))
        .should.be.equal(true);
    }
  });

  it("should unregister new user by list", async () => {
    for (const account of accounts.slice(idx5, idx6)) {
      (await kyc.registeredAddress(account))
        .should.be.equal(false);
    }
    await kyc.registerByList(accounts.slice(idx5, idx6));

    for (const account of accounts.slice(idx5, idx6)) {
      (await kyc.registeredAddress(account))
        .should.be.equal(true);
    }
    await kyc.unregisterByList(accounts.slice(idx5, idx6));

    for (const account of accounts.slice(idx5, idx6)) {
      (await kyc.registeredAddress(account))
        .should.be.equal(false);
    }
  });

  it("should setAdmin and register with new Admin", async () => {
    (await kyc.registeredAddress(accounts[ idx7 ]))
      .should.be.equal(false);

    await kyc.setAdmin(accounts[ newAdmin ])
      .should.be.fulfilled;

    await kyc.register(accounts[ idx7 ], {
      from: accounts[ newAdmin ],
    }).should.be.fulfilled;

    (await kyc.registeredAddress(accounts[ idx7 ]))
      .should.be.equal(true);
  });
});
