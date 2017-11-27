pragma solidity ^0.4.18;

import '../ownership/Ownable.sol';
import '../math/SafeMath.sol';

/**
 * @title PresaleKYC
 * @dev PresaleKYC contract handles the white list for ASTPresale contract
 * Only accounts registered in PresaleKYC contract can buy AST token as Presale.
 */
contract PresaleKYC is Ownable, SafeMath {

  // check the address is registered for token sale
  mapping (address => bool) public registeredAddress;

  // guaranteedlimit for each presale investor
  mapping (address => uint256) public presaleGuaranteedLimit;

  event Registered(address indexed _addr, uint256 _amount);
  event Unregistered(address indexed _addr);

  /**
   * @dev check whether the address is registered for token sale or not.
   * @param _addr address
   */
  modifier onlyRegistered(address _addr) {
    require(registeredAddress[_addr]);
    _;
  }

  /**
   * @dev register the address for token sale
   * @param _addr address The address to register for token sale
   */
  function register(address _addr, uint256 _maxGuaranteedLimit)
    public
    onlyOwner
  {
    require(_addr != address(0) && registeredAddress[_addr] == false);

    registeredAddress[_addr] = true;
    presaleGuaranteedLimit[_addr] = _maxGuaranteedLimit;

    Registered(_addr, _maxGuaranteedLimit);
  }

  /**
   * @dev register the addresses for token sale
   * @param _addrs address[] The addresses to register for token sale
   */
  function registerByList(address[] _addrs, uint256[] _maxGuaranteedLimits)
    public
    onlyOwner
  {
    for(uint256 i = 0; i < _addrs.length; i++) {
      require(_addrs[i] != address(0) && registeredAddress[_addrs[i]] == false);

      registeredAddress[_addrs[i]] = true;
      presaleGuaranteedLimit[_addrs[i]] = _maxGuaranteedLimits[i];

      Registered(_addrs[i], _maxGuaranteedLimits[i]);
    }
  }

  /**
   * @dev unregister the registered address
   * @param _addr address The address to unregister for token sale
   */
  function unregister(address _addr)
    public
    onlyOwner
    onlyRegistered(_addr)
  {

    registeredAddress[_addr] = false;
    presaleGuaranteedLimit[_addr] = 0;

    Unregistered(_addr);
  }

  /**
   * @dev unregister the registered addresses
   * @param _addrs address[] The addresses to unregister for token sale
   */
  function unregisterByList(address[] _addrs)
    public
    onlyOwner
  {
    for(uint256 i = 0; i < _addrs.length; i++) {
      require(registeredAddress[_addrs[i]]);

      registeredAddress[_addrs[i]] = false;
      presaleGuaranteedLimit[_addrs[i]] = 0;

      Unregistered(_addrs[i]);
    }

  }
}
