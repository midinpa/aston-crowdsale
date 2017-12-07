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
contract ReserveLockerForDemoInMainnet is SafeMath{
  using SafeERC20 for ERC20Basic;

  ERC20Basic public token;
  ATCCrowdSale public crowdsale;
  address public beneficiary;


  function ReserveLockerForDemo(address _token, address _crowdsale, address _beneficiary) {

    require(_token != 0x00);
    require(_crowdsale != 0x00);
    require(_beneficiary != 0x00);


    token = ERC20Basic(_token);
    crowdsale = ATCCrowdSale(_crowdsale);
    beneficiary = _beneficiary;
  }

  /**
   * @notice Transfers tokens held by timelock to beneficiary.
   */
   function release() public {
     uint256 finalizedTime = crowdsale.finalizedTime();
     require(finalizedTime > 0 && now > add(finalizedTime, 60 minutes));

     uint256 amount = token.balanceOf(this);
     require(amount > 0);

     token.safeTransfer(beneficiary, amount);
   }

  function setToken(address newToken) public {
    require(msg.sender == beneficiary);
    require(newToken != 0x00);

    token = ERC20Basic(newToken);
  }

}
