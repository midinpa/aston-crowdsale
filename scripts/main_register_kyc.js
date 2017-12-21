const fs = require('fs');
const Web3 = require('web3');
const path = require('path');

//TODO: ONTHER NODE
const providerUrl = "http://onther.io:60009";
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const kycAbi = require('../build/contracts/KYC.json').abi;

//TODO: KYCADDRESS
const kycAddress = "0xa96cae028ef41a2a8d7167c4c3645bd99e24daee";

//TODO: kycOwnerAccount
const kycOwnerAccount = "0x266085436a4d9cb25603a3b1ab72338f313d7377";

const kyc = web3.eth.contract(kycAbi).at(kycAddress);

const registerList = require('./main_registerList');

// EXECUTE
const register = async() => {
  try {
    const registerTx = await kyc.registerByList(registerList, {
      from: kycOwnerAccount,
      gas: 4500000
    });
    console.log('registerTx :', registerTx);

    //write in kyc_addresses.json
    fs.appendFileSync(path.join(__dirname, "./main_kyc_addresses.json"), JSON.stringify({
      txHash: registerTx,
      addresses: registerList
    }, undefined, 2));

  } catch (err) {
    console.log(err);
  }
}

//CHECK
const check_registerList = async() => {
  const checkList = []
  let noError = true;
  for (let i = 0; i < registerList.length; i++) {
    if (await kyc.registeredAddress(registerList[i])) {
      console.log(i, registerList[i], " is already registered before")
      noError = false;
    }

    if (checkList.indexOf(registerList[i]) != -1) {
      console.log(i, registerList[i], " is duplicate in registerList")
      noError = false;
    }
    checkList.push(registerList[i])
  }
  console.log("finish checking")
  return noError
}

check_registerList().then(noError => {
  if (noError)
    register();
  else
    console.log("There's a problem in main_registerList")
})
