pragma solidity ^0.4.18;

import "./tokenlock/TokenTimelock.sol";

contract ReserveLocker is TokenTimelock {

  function ReserveLocker(ERC20Basic _token, address _beneficiary, uint64 _releaseTime)
    TokenTimelock(_token, _beneficiary, _releaseTime) {}

  function setToken(ERC20Basic newToken) public {
    require(msg.sender == beneficiary);

    token = newToken;
  }
}
