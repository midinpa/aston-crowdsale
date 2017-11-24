pragma solidity ^0.4.18;

import "./tokenlock/TokenTimeLock.sol";

contract ReserveLocker is TokenTimeLock {

  function ReserveLocker(ERC20Basic _token, address _beneficiary, uint64 _releaseTime)
    TokenTimeLock(_token, _beneficiary, _releaseTime) {}

  function setToken(ERC20Basic newToken) public {
    require(msg.sender == beneficiary);
    require(newToken != 0x00);

    token = newToken;
  }
}
