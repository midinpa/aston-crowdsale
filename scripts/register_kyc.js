const Web3 = require('web3');

//TODO: ONTHER NODE
const providerUrl = "https://ropsten.infura.io";
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const kycAbi = require('../build/contracts/KYC.json').abi;


//TODO: KYCADDRESS
const kycAddress = "0xef2d57a6bf5c13c0b0c1af096361c7bd6c16bc34";

//TODO: kycOwnerAccount
const kycOwnerAccount = "0x0166685dD1FA8e6c061B13Fc16fFf3DEA94E8ba2";

const kyc = web3.eth.contract(kycAbi).at(kycAddress);

const registerList = [
  "0xE184E9e4B283A7c2E06EF4957bed5002389b53Aa"
];

// EXECUTE
const register = async (_registerList) => {
  try {
    const registerTx = await kyc.registerByList(_registerList, {
      from: kycOwnerAccount
    });

    console.log('registerTx :', registerTx);
  } catch (err) {
    console.log(err);
  }
}

register(registerList);
