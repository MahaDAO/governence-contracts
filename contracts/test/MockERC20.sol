// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ERC20, ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract MockERC20 is ERC20Permit {
    uint8 private _decimals;

    // solhint-disable-next-line
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimal
    ) ERC20Permit(name) ERC20(name, symbol) {
        _decimals = decimal;
        _mint(msg.sender, (1000000) * (10**decimal));
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
