pragma solidity ^0.4.18;

import './crowdsale/RefundVault.sol';
import './kyc/PresaleKYC.sol';
import './wallet/MultiSigWallet.sol';
import './AST.sol';
import './lifecycle/Pausable.sol';

contract ASTPresale is Pausable, PresaleKYC {
  AST public token;
  RefundVault public vault;
  MultiSigWallet public multisig;

  address[] reserveWallet;

  uint256 public rate;
  uint256 public weiRaised;
  uint256 public maxEtherCap;
  uint64 public startTime;
  uint64 public endTime;

  mapping (address => uint256) public buyerFunded;

  event PresaleTokenPurchase(address indexed buyer, address indexed beneficiary, uint256 toFund, uint256 tokens);

  function ASTPreslae(
    address _token,
    address _vault,
    address _multisig,
    address[] _reserveWallet,
    uint64 _startTime,
    uint64 _endTime,
    uint256 _maxEtherCap,
    uint256 _rate
    ) {
      token = AST(_token);
      vault = RefundVault(_vault);
      multisig = MultiSigWallet(_multisig);
      reserveWallet = _reserveWallet;
      startTime = _startTime;
      endTime = _endTime;
      maxEtherCap = _maxEtherCap;
      rate = _rate;
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
    uint guaranteedLimit = presaleGuaranteedLimit[beneficiary];
    require(guaranteedLimit > 0);

    // calculate eth amount
    uint256 weiAmount = msg.value;
    uint256 totalAmount = add(buyerFunded[beneficiary], weiAmount);

    uint256 toFund;
    if (totalAmount > guaranteedLimit) {
      toFund = sub(guaranteedLimit, buyerFunded[beneficiary]);
    } else {
      toFund = weiAmount;
    }

    require(toFund > 0);
    require(weiAmount >= toFund);

    uint256 tokens = mul(toFund, rate);
    uint256 toReturn = sub(weiAmount, toFund);

    weiRaised = add(weiRaised, toFund);
    buyerFunded[beneficiary] = add(buyerFunded[beneficiary], toFund);

    token.generateTokens(beneficiary, tokens);

    if (toReturn > 0) {
      msg.sender.transfer(toReturn);
    }
    forwardFunds(toFund);
    PresaleTokenPurchase(msg.sender, beneficiary, toFund, tokens);
  }

  function validPurchase() internal constant returns (bool) {
    bool nonZeroPurchase = msg.value != 0;
    return nonZeroPurchase && !maxReached();
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
    changeTokenController(newOwner);
    changeVaultOwner(newOwner);
  }
  function changeTokenController(address newOwner) onlyOwner internal {
    token.changeController(newOwner);
  }
  function changeVaultOwner(address newOwner) onlyOwner internal {
    vault.transferOwnership(newOwner);
  }
}
