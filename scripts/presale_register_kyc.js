const fs = require('fs');
const Web3 = require('web3');
const path = require('path');

//TODO: ONTHER NODE
const providerUrl = "http://localhost:8545";
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const presaleAbi = require('../build/contracts/ATCPresale.json').abi;


//TODO: KYCADDRESS
const presaleAddress = "0x04f85a11c8c30ff96ea01838c6198ae57fab5adb";

//TODO: kycOwnerAccount
const presaleOwnerAccount = "0xe90824420dee2b623faa16d7c9f50c8cb690462f";

const presale = web3.eth.contract(presaleAbi).at(presaleAddress);

const registerAddressList = require('./presale_registerList').addresses;
const registerAmountList = require('./presale_registerList').amounts;

// EXECUTE
const register = async (_registerAddressList, _registerAmountList) => {
  try {
    const registerTx = await presale.registerByList(_registerAddressList, _registerAmountList, {
      from: presaleOwnerAccount
    });
    console.log('registerTx :', registerTx);

    //write in kyc_addresses.json
    fs.appendFileSync(path.join(__dirname, "./presale_kyc_addresses.json"), JSON.stringify({
      txHash: registerTx,
      addresses: _registerAddressList,
      amounts: _registerAmountList
    }, undefined, 2));

  } catch (err) {
    console.log(err);
  }
}

register(registerAddressList, registerAmountList);
