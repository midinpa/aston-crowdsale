const fs = require('fs');
const Web3 = require('web3');
const path = require('path');

//TODO: ONTHER NODE
const providerUrl = "http://localhost:8545";
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const kycAbi = require('../build/contracts/KYC.json').abi;


//TODO: KYCADDRESS
const kycAddress = "0x0b1b5c9bed01437bd07a7a513f967ee1d3c654a5";

//TODO: kycOwnerAccount
const kycOwnerAccount = "0xe90824420dee2b623faa16d7c9f50c8cb690462f";

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
