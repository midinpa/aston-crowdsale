pragma solidity ^0.4.18;

import "./token/MiniMeToken.sol";


contract ATC is MiniMeToken {
  mapping (address => bool) public blacklisted;
  bool public generateFinished;

  // @dev ATC constructor just parametrizes the MiniMeToken constructor
  function ATC(address _tokenFactory)
          MiniMeToken(
              _tokenFactory,
              0x0,                     // no parent token
              0,                       // no snapshot block number from parent
              "Aston Token",  // Token name
              18,                      // Decimals
              "ATC",                   // Symbol
              false                     // Enable transfers
          ) {}

  function generateTokens(address _owner, uint _amount
      ) public onlyController returns (bool) {
        require(generateFinished == false);

        //check msg.sender (controller ??)
        return super.generateTokens(_owner, _amount);
      }
  function doTransfer(address _from, address _to, uint _amount
      ) internal returns(bool) {
        require(blacklisted[_from] == false);
        return super.doTransfer(_from, _to, _amount);
      }

  function finishGenerating() public onlyController returns (bool success) {
    generateFinished = true;
    return true;
  }

  function blacklistAccount(address tokenOwner) public onlyController returns (bool success) {
    blacklisted[tokenOwner] = true;
    return true;
  }
  function unBlacklistAccount(address tokenOwner) public onlyController returns (bool success) {
    blacklisted[tokenOwner] = false;
    return true;
  }

}
