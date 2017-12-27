const fs = require('fs');
const Web3 = require('web3');
const moment = require('moment');

//TODO: ONTHER NODE
const providerUrl = "http://ontherhome.iptime.org:60009";
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const crowdsaleAbi = require('../build/contracts/ATCCrowdSale2.json').abi;

//TODO: KYCADDRESS
const crowdsaleAddress = "0x951F614f81dA09C90E6187a14b759F98ED9e7490";

//TODO: kycOwnerAccount
const crowdsaleOwnerAccount = "0x266085436a4d9cb25603a3b1ab72338f313d7377";

const crowdsale = web3.eth.contract(crowdsaleAbi).at(crowdsaleAddress);

const additionalPeriodEndTime2 = moment.utc("2017-12-31T15:00").unix();

const secToMillisec = (sec) => {
  return sec * 1000;
}
const timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const waitUntil = async (targetTime) => {
  let now = moment().unix();
  await timeout(secToMillisec(targetTime - now));
}


// REGISTER
const finalize = async() => {
  try {
    const finalizeTx = await crowdsale.finalize({
      from: crowdsaleOwnerAccount,
      gas: 2000000
    });
    console.log('finalizeTx :', finalizeTx);

  } catch (err) {
    console.log(err);
  }
}

waitUntil(additionalPeriodEndTime2 + 100).then(() => {
  finalize()
})
