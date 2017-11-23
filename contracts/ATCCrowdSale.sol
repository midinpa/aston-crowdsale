pragma solidity ^0.4.18;

import './kyc/KYC.sol';
import './ATC.sol';
import './vault/RefundVault.sol';
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
  address public reserverLocker; //15% with 2 years lock
  address public teamLocker; // 15% with 2 years vesting

  struct Period {
    uint64 startTime;
    uint64 endTime;
    uint256 bonus; // used to calculate rate with bonus. ragne 0 ~ 15 (0% ~ 15%)
  }

  uint256 public baseRate = 1500; // 1 ETH = 1500 ATC

  Period[] public periods;
  uint256 public currentPeriod;
  uint8 constant public MAX_PERIOD_COUNT = 8;

  uint256 public weiRaised;
  uint256 public maxEtherCap;
  uint256 public minEtherCap;

  mapping (address => uint256) public beneficiaryFunded;

  address[] investorList;
  mapping (address => bool) inInvestorList;

  address public ATCController;

  uint256 public additionalBonusAmount1 = 300 ether;
  uint256 public additionalBonusAmount2 = 6000 ether;

  bool public isFinalized;
  uint256 public refundCompleted;
  bool public presaleFallBackCalled;


  event CrowdSaleTokenPurchase(address indexed _investor, address indexed _beneficiary, uint256 _toFund, uint256 _tokens, uint256 _bonus);
  event StartPeriod(uint64 _startTime, uint64 _endTime, uint256 _bonus);
  event Finalized();
  event PresaleFallBack(uint256 _presaleWeiRaised);
  event PushInvestorList(address _investor);
  event RefundAll(uint256 _numToRefund);


  function ATCCrowdSale (
    address _kyc,
    address _token,
    address _vault,
    address _presale,
    address[] _bountyAndCommunityAddresses,
    address _bountyAndCommunityAddressesMultiSig,
    address _reserverLocker,
    address _teamLocker,
    address _tokenController,
    uint256 _maxEtherCap,
    uint256 _minEtherCap
    ) {
      require(_kyc != 0x00 && _token != 0x00 && _vault != 0x00 && _presale != 0x00);
      require(_bountyAndCommunityAddressesMultiSig != 0x00);
      require(_reserverLocker != 0x00 && _teamLocker != 0x00);
      require(_tokenController != 0x00);

      for (uint i = 0 ; i < _bountyAndCommunityAddresses.length; i++) {
        require(_bountyAndCommunityAddresses[i] != 0x00);
      }
      require(0 < _minEtherCap && _minEtherCap < _maxEtherCap);

      kyc = KYC(_kyc);
      token = ATC(_token);
      vault = RefundVault(_vault);
      presale = _presale;

      bountyAndCommunityAddresses = _bountyAndCommunityAddresses;
      bountyAndCommunityAddressesMultiSig = _bountyAndCommunityAddressesMultiSig;
      reserverLocker = _reserverLocker;
      teamLocker = _teamLocker;
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

    PresaleFallBack(_presaleWeiRaised);

    return true;
  }

  event Log(string msg);

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

      // calculate eth amount
      uint256 weiAmount = msg.value;
      uint256 totalAmount = add(beneficiaryFunded[beneficiary], weiAmount);
      uint256 toFund;

      uint256 postWeiRaised = add(weiRaised, toFund);

      if (postWeiRaised > maxEtherCap) {
        toFund = sub(maxEtherCap, weiRaised);
      } else {
        toFund = weiAmount;
      }

      require(toFund > 0);
      require(weiAmount >= toFund);

      // TODO: test bonus
      uint256 bonus = getBonus();

      // bonus for eth amount
      if (additionalBonusAmount1 <= toFund) {
        bonus = add(bonus, 5); // 5% amount bonus for more than 300 ETH
        Log("300 ETH + : 5% bonus");
      }

      if (additionalBonusAmount2 <= toFund) {
        bonus = add(bonus, 5); // 10% amount bonus for more than 6000 ETH
        Log("6000 ETH + : 10% bonus");
      }

      uint256 rate = calculateRate(bonus);
      uint256 tokens = mul(toFund, rate);
      uint256 toReturn = sub(weiAmount, toFund);

      pushInvestorList(msg.sender);

      weiRaised = add(weiRaised, toFund);
      beneficiaryFunded[beneficiary] = add(beneficiaryFunded[beneficiary], toFund);

      token.generateTokens(beneficiary, tokens);

      if (toReturn > 0) {
        msg.sender.transfer(toReturn);
      }

      forwardFunds(toFund);
      CrowdSaleTokenPurchase(msg.sender, beneficiary, toFund, tokens, bonus);
  }

  function pushInvestorList(address investor) internal {
    if (!inInvestorList[investor]) {
      inInvestorList[investor] = true;
      investorList.push(investor);
    }

    PushInvestorList(investor);
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

  function getBonus() public constant returns (uint256) {
    return periods[currentPeriod].bonus;
  }

  /**
   * @dev rate = baseRate * (100 + bonus) / 100
   */
  function calculateRate(uint256 bonus) internal returns (uint256)  {
    return div(mul(baseRate, add(bonus, 100)), 100);
  }

  function startPeriod(uint64 _startTime, uint64 _endTime) public onlyOwner returns (bool) {
    require(periods.length < MAX_PERIOD_COUNT);
    require(!maxReached());
    require(now < _startTime && _startTime < _endTime);

    if (periods.length != 0) {
      require(sub(_endTime, _startTime) <= 7 days);
    }

    // 15% -> 10% -> 5% -> 0%
    Period memory newPeriod;
    newPeriod.startTime = _startTime;
    newPeriod.endTime = _endTime;

    if(periods.length < 4) {
      newPeriod.bonus = sub(15, mul(5, periods.length));
    } else {
      newPeriod.bonus = 0;
    }

    if (nonZeroPeriod()) {
      require(now > periods[currentPeriod].endTime);
      currentPeriod = add (currentPeriod, 1);
    }

    periods.push(newPeriod);

    StartPeriod(_startTime, _endTime, newPeriod.bonus);

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
    token.generateTokens(reserverLocker, reserveAmount);
    token.generateTokens(teamLocker, teamAmount);
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
    RefundAll(numToRefund);
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
