pragma solidity ^0.4.18;


import "../token/ERC20Basic.sol";
import "../token/SafeERC20.sol";
import "../math/SafeMath.sol";

/**
 * @title TokenTimelock
 * @dev TokenTimelock is a token holder contract that will allow a
 * beneficiary to extract the tokens after a given release time
 */
contract TokenTimelock2 is SafeMath{
  using SafeERC20 for ERC20Basic;

  // ERC20 basic token contract being held
  ERC20Basic public token;

  // beneficiary of tokens after they are released
  address public beneficiary;

  // timestamp when token release level changes
  uint64[] public timelines;

  uint256[] public releaseRatios;

  uint256 public collectedTokens;

  function TokenTimelock2(ERC20Basic _token, address _beneficiary, uint64[] _timelines, uint256[] _releaseRatios) {

    require(now < _timelines[0]);
    for (uint i = 0; i < _timelines.length - 1; i++) {
      require(_timelines[i] < _timelines[i+1]);
    }
    require(0 < _releaseRatios[0]);
    for (i = 0; i < _releaseRatios.length - 1; i++) {
      require(_releaseRatios[i] < _releaseRatios[i+1]);
    }
    require(_timelines.length == _releaseRatios.length);
    require(_beneficiary != 0x00);

    token = _token;
    beneficiary = _beneficiary;
    timelines = _timelines;
    releaseRatios = _releaseRatios;
  }

  /**
   * @notice Transfers tokens held by timelock to beneficiary.
   */
  function release() public {

    uint256 balance = token.balanceOf(address(this));
    uint256 total = add(balance, collectedTokens);
    uint256 currentRatio = releaseRatios[0];

    for (uint i = 0; i < timelines.length - 1; i++) {
      if (now >= timelines[i]) {
        currentRatio = releaseRatios[i+1];
      }
    }

    if (now >= timelines[timelines.length - 1]) {
      currentRatio = 100;
    }

    uint256 releasedAmount = div(mul(total, currentRatio), 100);
    require(releasedAmount > 0);

    uint256 grantAmount = sub(releasedAmount, collectedTokens);
    collectedTokens = add(collectedTokens, grantAmount);

    token.safeTransfer(beneficiary, grantAmount);
  }
}
