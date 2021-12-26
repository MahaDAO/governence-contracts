//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/AccessControl.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/math/SafeMath.sol";

import "./ERC20Proxy.sol";
import "../interfaces/IPoolToken.sol";

contract PoolToken is AccessControl, ERC20Proxy, IPoolToken {
    using SafeMath for uint256;

    IERC20[] public poolTokens;
    bool public initialized;
    bool public enableWithdrawals = true;
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "not admin");
        _;
    }

    modifier onlyGovernance() {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "not governance");
        _;
    }

    function initialize(
        string memory name,
        string memory symbol,
        IERC20[] memory poolTokens_,
        address owner,
        address governance
    ) external {
        require(!initialized);

        initializeERC20(name, symbol);
        poolTokens = poolTokens_;

        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        _setupRole(GOVERNANCE_ROLE, governance);

        _mint(owner, 10000 * 1e18);
        initialized = true;
    }

    function addPoolToken(IERC20 token) external onlyGovernance {
        poolTokens.push(token);
        emit TokenAdded(address(token));
    }

    function replacePoolToken(uint256 index, IERC20 token)
        external
        onlyGovernance
    {
        poolTokens[index] = token;
        emit TokenReplaced(address(token), index);
    }

    function mint(address to, uint256 amount) external onlyGovernance {
        _mint(to, amount);
    }

    function withdraw(uint256 amount) external override {
        _withdraw(amount, _msgSender(), _msgSender());
    }

    function withdrawTo(uint256 amount, address to) external override {
        _withdraw(amount, _msgSender(), to);
    }

    function _withdraw(
        uint256 amount,
        address from,
        address to
    ) internal {
        require(enableWithdrawals, "PoolToken: withdrawals disabled");
        require(amount > 0, "PoolToken: amount = 0");
        require(amount <= balanceOf(from), "PoolToken: amount > balance");

        // calculate how much share of the supply the user has
        uint256 percentage = amount.mul(1e8).div(totalSupply());

        // proportionately send each of the pool tokens to the user
        for (uint256 i = 0; i < poolTokens.length; i++) {
            if (address(poolTokens[i]) == address(0)) continue;
            uint256 balance = poolTokens[i].balanceOf(address(this));
            uint256 shareAmount = balance.mul(percentage).div(1e8);
            if (shareAmount > 0) poolTokens[i].transfer(to, shareAmount);
        }

        _burn(from, amount);
        emit Withdraw(from, to, amount);
    }

    function toggleWithdrawals() external onlyAdmin {
        enableWithdrawals = !enableWithdrawals;
        emit ToggleWithdrawals(enableWithdrawals);
    }

    function refundTokens(IERC20 token) external onlyAdmin {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(_msgSender(), balance);
        emit TokensRetrieved(address(token), _msgSender(), balance);
    }

    function ratePerToken() external view returns (uint256[] memory rates) {
        for (uint256 i = 0; i < poolTokens.length; i++) {
            if (address(poolTokens[i]) == address(0)) {
                rates[i] = 0;
                continue;
            }

            rates[i] = poolTokens[i].balanceOf(address(this)).mul(1e18).div(
                totalSupply()
            );
        }

        return rates;
    }
}
