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
const register = async (_registerList) => {
  try {
    const registerTx = await kyc.registerByList(_registerList, {
      from: kycOwnerAccount
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

register(registerList);
