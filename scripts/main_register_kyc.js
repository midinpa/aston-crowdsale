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

const rawList = require('./main_registerList');
const processed_registerList = [];

//PROCESS REGISTERLIST
const registerlistProcessor = () => {
  let isError;

  for (let i = 1; i < rawList.split('\n').length - 1; i++) {
    let element = rawList.split('\n')[i]

    element = element.replace(/(\s*)/g, "");

    if (!element.startsWith('0x')) {
      element = '0x'.concat(element)
    }

    if (element.length != 42) {
      console.log("address length problem : %d th element", i, element)
      isError = true;
    }
    processed_registerList.push(element);
  }
  return isError
}

// CHECK
const check_registerList = async(_registerList) => {
  const checkList = []
  let isError
  for (let i = 0; i < _registerList.length; i++) {
    if (await kyc.registeredAddress(_registerList[i])) {
      console.log(i, _registerList[i], " is already registered before")
      isError = true;
    }

    if (checkList.indexOf(_registerList[i]) != -1) {
      console.log(i, _registerList[i], " is duplicate in registerList")
      isError = true;
    }
    checkList.push(_registerList[i])
  }
  console.log("finish checking")
  return noError
}

// REGISTER
const register = async(_registerList) => {
  try {
    const registerTx = await kyc.registerByList(_registerList, {
      from: kycOwnerAccount,
      gas: 4500000
    });
    console.log('registerTx :', registerTx);

    //write in kyc_addresses.json
    fs.appendFileSync(path.join(__dirname, "./main_kyc_addresses.json"), JSON.stringify({
      txHash: registerTx,
      addresses: _registerList
    }, undefined, 2));

  } catch (err) {
    console.log(err);
  }
}


// EXECUTE
if (!registerlistProcessor()) {
  console.log(processed_registerList)
  check_registerList(processed_registerList).then(noError => {
    if (noError)
      register(processed_registerList);
    else
      console.log("There's a problem in main_registerList")
  })
}
