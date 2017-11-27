pragma solidity ^0.4.18;

import './ownership/Ownable.sol';
import './vault/RefundVault.sol';
import './ATC.sol';
import './kyc/PresaleKYC.sol';
import './lifecycle/Pausable.sol';
import './math/SafeMath.sol';
import './kyc/KYC.sol';
import './token/ERC20Basic.sol';

contract PresaleFallbackReceiver {
    function presaleFallBack(uint256 _presaleWeiRaised) public returns (bool);
}

contract ATCPresale is Ownable, PresaleKYC, Pausable {
  ATC public token;
  RefundVault public vault;
  KYC public kyc;

  uint256 public rate;
  uint256 public publicRate;
  uint256 public weiRaised;
  uint256 public maxEtherCap;
  uint64 public startTime;
  uint64 public endTime;

  bool public isFinalized;
  mapping (address => uint256) public beneficiaryFunded;

  event PresaleTokenPurchase(address indexed buyer, address indexed beneficiary, uint256 toFund, uint256 tokens);
  event ClaimedTokens(address _claimToken, address owner, uint256 balance);

  function ATCPresale(
    address _token,
    address _vault,
    address _kyc,
    uint64 _startTime,
    uint64 _endTime,
    uint256 _maxEtherCap,
    uint256 _rate,
    uint256 _publicRate
    ) {
      require(_token != 0x00 && _vault != 0x00 && _kyc != 0x00);
      require(now < _startTime && _startTime < _endTime);
      require(_maxEtherCap > 0);
      require(_rate > 0 && _publicRate > 0);

      token = ATC(_token);
      vault = RefundVault(_vault);
      kyc = KYC(_kyc);
      startTime = _startTime;
      endTime = _endTime;
      maxEtherCap = _maxEtherCap;
      rate = _rate;
      publicRate = _publicRate;
    }

  function () payable {
    buyPresale(msg.sender);
  }

  function buyPresale(address beneficiary)
    payable
    onlyRegistered(beneficiary)
    whenNotPaused
  {
    // check validity
    require(beneficiary != 0x00);
    require(validPurchase());

    require(registeredAddress[beneficiary] || kyc.registeredAddress(beneficiary));

    uint256 myRate;
    uint256 weiAmount = msg.value;
    uint256 toFund = weiAmount;

    if (registeredAddress[beneficiary]) {
      uint256 guaranteedLimit = presaleGuaranteedLimit[beneficiary];
      require(guaranteedLimit > 0);

      uint256 totalAmount = add(beneficiaryFunded[beneficiary], weiAmount);
      if (totalAmount > guaranteedLimit) {
        toFund = sub(guaranteedLimit, beneficiaryFunded[beneficiary]);
      }
      myRate = rate;

    } else if (kyc.registeredAddress(beneficiary)) {
      myRate = publicRate;
    }

    uint256 postWeiRaised = add(weiRaised, toFund);
    if (postWeiRaised > maxEtherCap) {
      toFund = sub(maxEtherCap, weiRaised);
    }

    require(toFund > 0);
    require(weiAmount >= toFund);
    require(myRate > 0);

    uint256 tokens = mul(toFund, myRate);
    uint256 toReturn = sub(weiAmount, toFund);

    weiRaised = add(weiRaised, toFund);
    beneficiaryFunded[beneficiary] = add(beneficiaryFunded[beneficiary], toFund);

    //TODO: Error check
    token.generateTokens(beneficiary, tokens);

    if (toReturn > 0) {
      msg.sender.transfer(toReturn);
    }
    forwardFunds(toFund);
    PresaleTokenPurchase(msg.sender, beneficiary, toFund, tokens);
  }

  function validPurchase() internal constant returns (bool) {
    bool nonZeroPurchase = msg.value != 0;
    bool validTime = now >= startTime && now <= endTime;
    return nonZeroPurchase && !maxReached() && validTime;
  }

  /**
   * @dev Checks whether maxEtherCap is reached
   * @return true if max ether cap is reaced
   */
  function maxReached() public constant returns (bool) {
    return weiRaised == maxEtherCap;
  }

  function forwardFunds(uint256 toFund) internal {
    vault.deposit.value(toFund)(msg.sender);
  }

  event Log(string messgae); // for dev

  function finalizePresale(
    address newOwner
    ) onlyOwner {
      require(!isFinalized);
      require(now > endTime);

      PresaleFallbackReceiver crowdsale = PresaleFallbackReceiver(newOwner);

      require(crowdsale.presaleFallBack(weiRaised));

      changeTokenController(newOwner);
      changeVaultOwner(newOwner);

      isFinalized = true;
  }
  function changeTokenController(address newOwner) onlyOwner internal {
    token.changeController(newOwner);
  }
  function changeVaultOwner(address newOwner) onlyOwner internal {
    vault.transferOwnership(newOwner);
  }

  function claimTokens(address _claimToken) public onlyOwner {

    if (token.controller() == address(this)) {
         token.claimTokens(_claimToken);
    }

    if (_claimToken == 0x0) {
        owner.transfer(this.balance);
        return;
    }

    ERC20Basic claimToken = ERC20Basic(_claimToken);
    uint256 balance = claimToken.balanceOf(this);
    claimToken.transfer(owner, balance);

    ClaimedTokens(_claimToken, owner, balance);
  }
}
