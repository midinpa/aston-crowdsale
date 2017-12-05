pragma solidity ^0.4.18;

import "./token/ERC20Basic.sol";
import "./token/SafeERC20.sol";
import "./math/SafeMath.sol";
import './ATCCrowdSale.sol';

/**
 * @title TokenTimelock
 * @dev TokenTimelock is a token holder contract that will allow a
 * beneficiary to extract the tokens after a given release time
 */
contract TeamLockerForDemo is SafeMath{
  using SafeERC20 for ERC20Basic;

  ERC20Basic public token;

  ATCCrowdSale public crowdsale;

  address[] public beneficiaries;

  uint256 public collectedTokens;

  function TeamLockerForDemo(address _token, address _crowdsale, address[] _beneficiaries) {

    require(_token != 0x00);
    require(_crowdsale != 0x00);

    for (uint i = 0; i < _beneficiaries.length; i++) {
      require(_beneficiaries[i] != 0x00);
    }

    token = ERC20Basic(_token);
    crowdsale = ATCCrowdSale(_crowdsale);
    beneficiaries = _beneficiaries;
  }

  /**
   * @notice Transfers tokens held by timelock to beneficiary.
   */
  function release() public {

    uint256 balance = token.balanceOf(address(this));
    uint256 total = add(balance, collectedTokens);

    uint256 finalizedTime = crowdsale.finalizedTime();
    require(finalizedTime > 0);

    uint256 lockTime1 = add(finalizedTime, 10 minutes); // 6 months
    uint256 lockTime2 = add(finalizedTime, 20 minutes); // 1 year

    uint256 currentRatio = 20;

    if (now >= lockTime1) {
      currentRatio = 50;
    }

    if (now >= lockTime2) {
      currentRatio = 100;
    }

    uint256 releasedAmount = div(mul(total, currentRatio), 100);
    uint256 grantAmount = sub(releasedAmount, collectedTokens);
    require(grantAmount > 0);
    collectedTokens = add(collectedTokens, grantAmount);
    uint256 grantAmountForEach = div(grantAmount, 3);

    for (uint i = 0; i < beneficiaries.length; i++) {
        token.safeTransfer(beneficiaries[i], grantAmountForEach);
    }
  }

  function setToken(address newToken) public {
    require(newToken != 0x00);

    bool isBeneficiary;

    for (uint i = 0; i < beneficiaries.length; i++) {
      if (msg.sender == beneficiaries[i]) {
        isBeneficiary = true;
      }
    }
    require(isBeneficiary);

    token = ERC20Basic(newToken);
  }

}
