pragma solidity ^0.4.18;

import './kyc/KYC.sol';
import './ATC.sol';
import './vault/RefundVault.sol';
import './ownership/Ownable.sol';
import './math/SafeMath.sol';
import './lifecycle/Pausable.sol';
import './token/ERC20Basic.sol';
import './ReserveLocker.sol';
import './TeamLocker.sol';

contract ATCCrowdSale is Ownable, SafeMath, Pausable {
  KYC public kyc;
  ATC public token;
  RefundVault public vault;

  address public presale;

  address public bountyAddress; //5% for bounty
  address public partnersAddress; //15% for community groups & partners
  address public ATCReserveLocker; //15% with 2 years lock
  address public teamLocker; // 15% with 2 years vesting


  struct Period {
    uint256 startTime;
    uint256 endTime;
    uint256 bonus; // used to calculate rate with bonus. ragne 0 ~ 15 (0% ~ 15%)
  }

  uint256 public baseRate; // 1 ETH = 1500 ATC
  uint256[] public additionalBonusAmounts;

  Period[] public periods;
  uint8 constant public MAX_PERIOD_COUNT = 8;

  uint256 public weiRaised;
  uint256 public maxEtherCap;
  uint256 public minEtherCap;

  mapping (address => uint256) public beneficiaryFunded;

  address[] investorList;
  mapping (address => bool) inInvestorList;

  address public ATCController;

  bool public isFinalized;
  uint256 public refundCompleted;
  bool public presaleFallBackCalled;

  uint256 public finalizedTime;
  bool public initialized;


  event CrowdSaleTokenPurchase(address indexed _investor, address indexed _beneficiary, uint256 _toFund, uint256 _tokens);
  event StartPeriod(uint256 _startTime, uint256 _endTime, uint256 _bonus);
  event Finalized();
  event PresaleFallBack(uint256 _presaleWeiRaised);
  event PushInvestorList(address _investor);
  event RefundAll(uint256 _numToRefund);
  event ClaimedTokens(address _claimToken, address owner, uint256 balance);
  event Initialize();

  function initialize (
    address _kyc,
    address _token,
    address _vault,
    address _presale,
    address _bountyAddress,
    address _partnersAddress,
    address _ATCReserveLocker,
    address _teamLocker,
    address _tokenController,
    uint256 _maxEtherCap,
    uint256 _minEtherCap,
    uint256 _baseRate,
    uint256[] _additionalBonusAmounts
    ) onlyOwner {
      require(!initialized);

      require(_kyc != 0x00 && _token != 0x00 && _vault != 0x00 && _presale != 0x00);
      require(_bountyAddress != 0x00 && _partnersAddress != 0x00);
      require(_ATCReserveLocker != 0x00 && _teamLocker != 0x00);
      require(_tokenController != 0x00);
      require(0 < _minEtherCap && _minEtherCap < _maxEtherCap);
      require(_baseRate > 0);
      require(_additionalBonusAmounts[0] > 0);

      for (uint i = 0; i < _additionalBonusAmounts.length - 1; i++) {
        require(_additionalBonusAmounts[i] < _additionalBonusAmounts[i + 1]);
      }

      kyc = KYC(_kyc);
      token = ATC(_token);
      vault = RefundVault(_vault);
      presale = _presale;

      bountyAddress = _bountyAddress;
      partnersAddress = _partnersAddress;

      ATCReserveLocker = _ATCReserveLocker;
      teamLocker = _teamLocker;

      ATCController = _tokenController;

      maxEtherCap = _maxEtherCap;
      minEtherCap = _minEtherCap;

      baseRate = _baseRate;
      additionalBonusAmounts = _additionalBonusAmounts;

      initialized = true;
      Initialize();
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

  function buy(address beneficiary)
    public
    payable
    whenNotPaused
  {
      // check validity
      require(presaleFallBackCalled);
      require(beneficiary != 0x00);
      require(kyc.registeredAddress(beneficiary));
      require(onSale());
      require(validPurchase());
      require(!isFinalized);

      // calculate eth amount
      uint256 weiAmount = msg.value;
      uint256 toFund;

      uint256 postWeiRaised = add(weiRaised, weiAmount);

      if (postWeiRaised > maxEtherCap) {
        toFund = sub(maxEtherCap, weiRaised);
      } else {
        toFund = weiAmount;
      }

      require(toFund > 0);
      require(weiAmount >= toFund);

      uint256 rate = calculateRate(toFund);
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
      CrowdSaleTokenPurchase(msg.sender, beneficiary, toFund, tokens);
  }

  function pushInvestorList(address investor) internal {
    if (!inInvestorList[investor]) {
      inInvestorList[investor] = true;
      investorList.push(investor);

      PushInvestorList(investor);
    }
  }

  function validPurchase() internal constant returns (bool) {
    bool nonZeroPurchase = msg.value != 0;
    return nonZeroPurchase && !maxReached();
  }

  function forwardFunds(uint256 toFund) internal {
    vault.deposit.value(toFund)(msg.sender);
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

  function getPeriodBonus() public constant returns (uint256) {
    bool nowOnSale;
    uint256 currentPeriod;

    for (uint i = 0; i < periods.length; i++) {
      if (periods[i].startTime <= now && now <= periods[i].endTime) {
        nowOnSale = true;
        currentPeriod = i;
        break;
      }
    }

    require(nowOnSale);
    return periods[currentPeriod].bonus;
  }

  /**
   * @dev rate = baseRate * (100 + bonus) / 100
   */
  function calculateRate(uint256 toFund) public constant returns (uint256)  {
    uint bonus = getPeriodBonus();

    // bonus for eth amount
    if (additionalBonusAmounts[0] <= toFund) {
      bonus = add(bonus, 5); // 5% amount bonus for more than 300 ETH
    }

    if (additionalBonusAmounts[1] <= toFund) {
      bonus = add(bonus, 5); // 10% amount bonus for more than 6000 ETH
    }

    if (additionalBonusAmounts[2] <= toFund) {
      bonus = 25; // final 25% amount bonus for more than 8000 ETH
    }

    if (additionalBonusAmounts[3] <= toFund) {
      bonus = 30; // final 30% amount bonus for more than 10000 ETH
    }

    return div(mul(baseRate, add(bonus, 100)), 100);
  }

  function startPeriod(uint256 _startTime, uint256 _endTime) public onlyOwner returns (bool) {
    require(periods.length < MAX_PERIOD_COUNT);
    require(now < _startTime && _startTime < _endTime);


    if (periods.length != 0) {
      require(sub(_endTime, _startTime) <= 7 days);
      require(periods[periods.length - 1].endTime < _startTime);
    }

    // 15% -> 10% -> 5% -> 0%
    Period memory newPeriod;
    newPeriod.startTime = _startTime;
    newPeriod.endTime = _endTime;

    if(periods.length < 3) {
      newPeriod.bonus = sub(15, mul(5, periods.length));
    } else {
      newPeriod.bonus = 0;
    }

    periods.push(newPeriod);
    StartPeriod(_startTime, _endTime, newPeriod.bonus);

    return true;
  }

  function onSale() public returns (bool) {
    bool nowOnSale;

    for (uint i = 0; i < periods.length; i++) {
      if (periods[i].startTime <= now && now <= periods[i].endTime) {
        nowOnSale = true;
        break;
      }
    }

    return nowOnSale;
  }
  /**
   * @dev should be called after crowdsale ends, to do
   */
  function finalize() onlyOwner {
    require(!isFinalized);
    require(!onSale() || maxReached());

    finalizedTime = now;

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

      // token distribution : 50% for sale, 5% for bounty, 15% for partners, 15% for reserve, 15% for team
      uint256 bountyAmount = div(mul(totalToken, 5), 50);
      uint256 partnersAmount = div(mul(totalToken, 15), 50);
      uint256 reserveAmount = div(mul(totalToken, 15), 50);
      uint256 teamAmount = div(mul(totalToken, 15), 50);

      distributeToken(bountyAmount, partnersAmount, reserveAmount, teamAmount);

      token.enableTransfers(true);

    } else {
      vault.enableRefunds();
    }
    token.finishGenerating();
    token.changeController(ATCController);
  }

  function distributeToken(uint256 bountyAmount, uint256 partnersAmount, uint256 reserveAmount, uint256 teamAmount) internal {
    require(bountyAddress != 0x00 && partnersAddress != 0x00);
    require(ATCReserveLocker != 0x00 && teamLocker != 0x00);

    token.generateTokens(bountyAddress, bountyAmount);
    token.generateTokens(partnersAddress, partnersAmount);
    token.generateTokens(ATCReserveLocker, reserveAmount);
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
