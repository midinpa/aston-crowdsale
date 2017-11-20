pragma solidity ^0.4.18;

import './crowdsale/RefundVault.sol';
import './ATC.sol';
import './kyc/PresaleKYC.sol';
import './lifecycle/Pausable.sol';
import './math/SafeMath.sol';

contract ATCCrowdSaleInterface {
    function presaleFallBack(uint256 _presaleWeiRaised) public returns (bool);
}

contract ATCPresale is PresaleKYC, Pausable {
  ATC public token;
  RefundVault public vault;

  address[] reserveWallet;

  uint256 public rate;
  uint256 public weiRaised;
  uint256 public maxEtherCap;
  uint64 public startTime;
  uint64 public endTime;

  bool public isFinalized;
  mapping (address => uint256) public beneficiaryFunded;

  event PresaleTokenPurchase(address indexed buyer, address indexed beneficiary, uint256 toFund, uint256 tokens);

  function ATCPresale(
    address _token,
    address _vault,
    address[] _reserveWallet,
    uint64 _startTime,
    uint64 _endTime,
    uint256 _maxEtherCap,
    uint256 _rate
    ) {
      require(_token != 0x00 && _vault != 0x00);
      for(uint256 i = 0; i < _reserveWallet.length; i++){
        require(_reserveWallet[i] != 0x00);
      }

      require(now < _startTime && _startTime < _endTime);
      require(_maxEtherCap > 0);
      require(_rate > 0);

      token = ATC(_token);
      vault = RefundVault(_vault);
      reserveWallet = _reserveWallet;
      startTime = _startTime;
      endTime = _endTime;
      maxEtherCap = _maxEtherCap;
      rate = _rate;
    }

  function () payable {
    buyPresale(msg.sender);
  }

  function register(address _addr, uint256 _maxGuaranteedLimit)
    public
    onlyOwner
  {
    uint256 postTotalPresaleGuaranteedLimit = add(totalPresaleGuaranteedLimit, _maxGuaranteedLimit);
    require(maxEtherCap >= postTotalPresaleGuaranteedLimit);

    super.register(_addr, _maxGuaranteedLimit);
  }

  function registerByList(address[] _addrs, uint256[] _maxGuaranteedLimits)
    public
    onlyOwner
  {
    uint256 postTotalPresaleGuaranteedLimit = totalPresaleGuaranteedLimit;
    for(uint256 i = 0; i < _addrs.length; i++) {
      postTotalPresaleGuaranteedLimit = add(postTotalPresaleGuaranteedLimit, _maxGuaranteedLimits[i]);
    }
    require(maxEtherCap >= postTotalPresaleGuaranteedLimit);

    super.registerByList(_addrs, _maxGuaranteedLimits);
  }

  function unregister(address _addr)
    public
    onlyOwner
    onlyRegistered(_addr)
  {
    require(beneficiaryFunded[_addr] == 0);
    super.unregister(_addr);
  }

  /**
   * @dev unregister the registered addresses
   * @param _addrs address[] The addresses to unregister for token sale
   */
  function unregisterByList(address[] _addrs)
    public
    onlyOwner
  {
    uint256 totalbeneficiaryFunded;
    for(uint256 i = 0; i < _addrs.length; i++) {
      totalbeneficiaryFunded = add(totalbeneficiaryFunded, beneficiaryFunded[_addrs[i]]);
    }
    require(totalbeneficiaryFunded == 0);
    super.unregisterByList(_addrs);
  }

  function buyPresale(address beneficiary)
    payable
    onlyRegistered(beneficiary)
    whenNotPaused
  {
    // check validity
    require(beneficiary != 0x00);
    require(validPurchase());
    uint guaranteedLimit = presaleGuaranteedLimit[beneficiary];
    require(guaranteedLimit > 0);

    // calculate eth amount
    uint256 weiAmount = msg.value;
    uint256 totalAmount = add(beneficiaryFunded[beneficiary], weiAmount);

    uint256 toFund;

    if (totalAmount > guaranteedLimit) {
      toFund = sub(guaranteedLimit, beneficiaryFunded[beneficiary]);
    } else {
      toFund = weiAmount;
    }

    require(toFund > 0);
    require(weiAmount >= toFund);

    uint256 tokens = mul(toFund, rate);
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

  function finalizePresale(
    address newOwner
    ) onlyOwner {
      require(!isFinalized);
      require(now > endTime);

      ATCCrowdSaleInterface crowdsale = ATCCrowdSaleInterface(newOwner);
      crowdsale.presaleFallBack(weiRaised);

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
}
