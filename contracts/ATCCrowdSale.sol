pragma solidity ^0.4.18;

import './kyc/KYC.sol';
import './ATC.sol';
import './crowdsale/RefundVault.sol';
import './ownership/Ownable.sol';
import './math/SafeMath.sol';
import './lifecycle/Pausable.sol';

contract ATCCrowdSale is Ownable, SafeMath, Pausable {
  KYC public kyc;
  ATC public token;
  RefundVault public vault;

  address public presale;

  address[] public bountyAndCommunityAddresses; //5% for bounty, 15% for community groups & partners
  address public bountyAndCommunityAddressesMultiSig; //5% for bounty, 15% for community groups & partners
  address public reserveAddress; //15% with 2 years lock
  address public teamAddress; // 15% with 2 years vesting

  struct Period {
    uint64 startTime;
    uint64 endTime;
    uint8 rate;
  }

  Period[] public periods;
  uint256 public currentPeriod;
  uint8 constant public MAX_PERIOD_COUNT = 7;

  uint256 public weiRaised;
  uint256 public maxEtherCap;
  uint256 public minEtherCap;

  uint256 constant public maxGuaranteedLimit = 5000 ether;
  mapping (address => uint256) public beneficiaryFunded;

  address[] investorList;
  mapping (address => bool) inInvestorList;

  address public ATCController;

  bool public isFinalized;
  uint256 public refundCompleted;
  bool public presaleFallBackCalled;


  event CrowdSaleTokenPurchase(address indexed investor, address indexed beneficiary, uint256 toFund, uint256 tokens);
  event StartPeriod(uint64 _startTime, uint64 _endTime, uint8 _rate);
  event Finalized();
  event Log(string messgae); // for dev


  function ATCCrowdSale (
    address _kyc,
    address _token,
    address _vault,
    address _presale,
    address[] _bountyAndCommunityAddresses,
    address _bountyAndCommunityAddressesMultiSig,
    address _reserveAddress,
    address _teamAddress,
    address _tokenController,
    uint256 _maxEtherCap,
    uint256 _minEtherCap
    ) {
      // TODO: check conditions
      kyc = KYC(_kyc);
      token = ATC(_token);
      vault = RefundVault(_vault);
      presale = _presale;

      bountyAndCommunityAddresses = _bountyAndCommunityAddresses;
      bountyAndCommunityAddressesMultiSig = _bountyAndCommunityAddressesMultiSig;
      reserveAddress = _reserveAddress;
      teamAddress = _teamAddress;
      ATCController = _tokenController;

      maxEtherCap = _maxEtherCap;
      minEtherCap = _minEtherCap;
    }

  function () public payable {
    buy(msg.sender);
  }

  function presaleFallBack(uint256 _presaleWeiRaised) public returns (bool) {
    require(!presaleFallBackCalled);
    require(msg.sender == presale);
    weiRaised = _presaleWeiRaised;
    presaleFallBackCalled = true;
    return true;
  }

  function buy(address beneficiary)
    public
    payable
    whenNotPaused
  {
      // check validity
      require(kyc.registeredAddress(beneficiary));
      require(presaleFallBackCalled);
      require(nonZeroPeriod());
      require(!periodFinished(currentPeriod));
      require(beneficiary != 0x00);
      require(validPurchase());

      Log("buy condition check");

      // calculate eth amount
      uint256 weiAmount = msg.value;
      uint256 totalAmount = add(beneficiaryFunded[beneficiary], weiAmount);

      uint256 toFund;

      if (totalAmount > maxGuaranteedLimit) {
        toFund = sub(maxGuaranteedLimit, beneficiaryFunded[beneficiary]);
      } else {
        toFund = weiAmount;
      }

      uint256 postWeiRaised = add(weiRaised, toFund);

      if (postWeiRaised > maxEtherCap) {
        toFund = sub(maxEtherCap, weiRaised);
      }

      require(toFund > 0);
      require(weiAmount >= toFund);

      uint256 currentRate = getRate();
      uint256 tokens = mul(toFund, currentRate);
      uint256 toReturn = sub(weiAmount, toFund);

      pushInvestorList(msg.sender);

      weiRaised = add(weiRaised, toFund);
      beneficiaryFunded[beneficiary] = add(beneficiaryFunded[beneficiary], toFund);

      //TODO: Error check
      token.generateTokens(beneficiary, tokens);

      if (toReturn > 0) {
        msg.sender.transfer(toReturn);
      }
      forwardFunds(toFund);
      CrowdSaleTokenPurchase(msg.sender, beneficiary, toFund, tokens);
  }

  function pushInvestorList(address investor) internal {
    if (!inInvestorList[investor]) {
      inInvestorList[investor] = true;
      investorList.push(investor);
    }
  }

  function validPurchase() internal constant returns (bool) {
    bool nonZeroPurchase = msg.value != 0;
    bool validTime = now >= periods[currentPeriod].startTime && now <= periods[currentPeriod].endTime;
    return nonZeroPurchase && !maxReached() && validTime;
  }

  function forwardFunds(uint256 toFund) internal {
    vault.deposit.value(toFund)(msg.sender);
  }

  function nonZeroPeriod() public constant returns (bool) {
    return periods.length > 0;
  }

  function periodFinished(uint256 period) public constant returns (bool) {
    require(sub(periods.length, 1) >= period);
    return nonZeroPeriod() && now > periods[period].endTime;
  }

  /**
   * @dev Checks whether minEtherCap is reached
   * @return true if min ether cap is reaced
   */
  function minReached() public constant returns (bool) {
    return weiRaised >= minEtherCap;
  }
  /**
   * @dev Checks whether maxEtherCap is reached
   * @return true if max ether cap is reaced
   */
  function maxReached() public constant returns (bool) {
    return weiRaised == maxEtherCap;
  }

  function getRate() public constant returns (uint8) {
    return periods[currentPeriod].rate;
  }

  function startPeriod(uint64 _startTime, uint64 _endTime, uint8 _rate) public onlyOwner returns (bool) {
    require(periods.length < MAX_PERIOD_COUNT);
    require(!maxReached());
    require(now < _startTime && _startTime < _endTime);
    require(_rate > 0);

    Period memory newPeriod;
    newPeriod.startTime = _startTime;
    newPeriod.endTime = _endTime;
    newPeriod.rate = _rate;

    if (nonZeroPeriod()) {
      require(now > periods[currentPeriod].endTime);
      currentPeriod = add (currentPeriod, 1);
    }

    periods.push(newPeriod);

    StartPeriod(_startTime, _endTime, _rate);

    return true;
  }

  /**
   * @dev should be called after crowdsale ends, to do
   */
  function finalize() onlyOwner {
    require(!isFinalized);
    require(periodFinished(currentPeriod) || maxReached());

    finalization();
    Finalized();

    isFinalized = true;
  }

  /**
   * @dev end token minting on finalization, mint tokens for dev team and reserve wallets
   */
  function finalization() internal {
    if (minReached()) {
      vault.close();

      uint256 totalToken = token.totalSupply();

      // token distribution : 50% for sale, 20% for bounty and community, 15% for reserve, 15% for team
      uint256 bountyAndCommunityAmount = div(mul(totalToken, 20), 50);
      uint256 reserveAmount = div(mul(totalToken, 15), 50);
      uint256 teamAmount = div(mul(totalToken, 15), 50);

      distributeToken(bountyAndCommunityAmount, reserveAmount, teamAmount);

      token.enableTransfers(true);

    } else {
      vault.enableRefunds();
    }
    token.finishGenerating();
    token.changeController(ATCController);
  }

  function distributeToken(uint256 bountyAndCommunityAmount, uint256 reserveAmount, uint256 teamAmount) internal {
    // TODO: check bountyAndCommunityAmount distribution ratio
    // 3 wallets, 1 multisig
    uint256 bountyAndCommunityAmountForEach = div(bountyAndCommunityAmount, bountyAndCommunityAddresses.length + 1);

    for (uint256 i = 0; i < bountyAndCommunityAddresses.length; i++) {
        token.generateTokens(bountyAndCommunityAddresses[i], bountyAndCommunityAmountForEach);
    }

    token.generateTokens(bountyAndCommunityAddressesMultiSig, bountyAndCommunityAmountForEach);
    token.generateTokens(reserveAddress, reserveAmount);
    token.generateTokens(teamAddress, teamAmount);
  }

  /**
   * @dev refund a lot of investors at a time checking onlyOwner
   * @param numToRefund uint256 The number of investors to refund
   */
  function refundAll(uint256 numToRefund) onlyOwner {
    require(isFinalized);
    require(!minReached());
    require(numToRefund > 0);

    uint256 limit = refundCompleted + numToRefund;

    if (limit > investorList.length) {
      limit = investorList.length;
    }

    for(uint256 i = refundCompleted; i < limit; i++) {
      vault.refund(investorList[i]);
    }

    refundCompleted = limit;
  }

  /**
   * @dev if crowdsale is unsuccessful, investors can claim refunds here
   * @param investor address The account to be refunded
   */
  function claimRefund(address investor) returns (bool) {
    require(isFinalized);
    require(!minReached());

    return vault.refund(investor);
  }
}
