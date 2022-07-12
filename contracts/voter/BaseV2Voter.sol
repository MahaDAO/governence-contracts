// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {EIP712, Votes} from "@openzeppelin/contracts/governance/utils/Votes.sol";

import {IBribeV2} from "../interfaces/IBribeV2.sol";
import {IBribeFactory} from "../interfaces/IBribeFactory.sol";
import {IEmissionController} from "../interfaces/IEmissionController.sol";
import {IGauge} from "../interfaces/IGauge.sol";
import {IGaugeFactory} from "../interfaces/IGaugeFactory.sol";
import {IGaugeVoterV2} from "../interfaces/IGaugeVoterV2.sol";
import {IRegistry} from "../interfaces/IRegistry.sol";
import {IUniswapV2Pair} from "../interfaces/IUniswapV2Pair.sol";
import {INFTStaker} from "../interfaces/INFTStaker.sol";

/**
 * This contract is an extension of the BaseV1Voter that was originally written by Andre.
 * This contract allows delegation and captures voting power of a user overtime. This contract
 * is also compatible with openzepplin's Governor contract.
 */
contract BaseV2Voter is ReentrancyGuard, Ownable, IGaugeVoterV2 {
    IRegistry public immutable override registry;

    uint256 internal constant DURATION = 7 days; // rewards are released over 7 days
    IEmissionController public emissionController;

    uint256 public totalWeight; // total voting weight

    address[] public pools; // all pools viable for incentives
    mapping(address => address) public gauges; // pool => gauge
    mapping(address => address) public poolForGauge; // gauge => pool
    mapping(address => address) public bribes; // gauge => bribe
    mapping(address => int256) public weights; // pool => weight
    mapping(address => mapping(address => int256)) public votes; // nft => pool => votes
    mapping(address => address[]) public poolVote; // nft => pools
    mapping(address => uint256) public usedWeights; // nft => total voting weight of user
    mapping(address => bool) public isGauge;
    mapping(address => bool) public whitelist;

    uint256 internal index;
    mapping(address => uint256) internal supplyIndex;
    mapping(address => uint256) public claimable;

    modifier onlyGauge() {
        require(isGauge[msg.sender], "not gauge");
        _;
    }

    constructor(
        address _registry,
        address _emissionController,
        address _governance
    ) {
        registry = IRegistry(_registry);
        emissionController = IEmissionController(_emissionController);

        _transferOwnership(_governance);
    }

    function reset() external override {
        _reset(msg.sender);
    }

    function resetFor(address who) external override {
        require(msg.sender == registry.staker(), "not staker contract");
        _reset(who);
    }

    function _reset(address _tokenId) internal {
        address[] storage _poolVote = poolVote[_tokenId];
        uint256 _poolVoteCnt = _poolVote.length;
        int256 _totalWeight = 0;

        for (uint256 i = 0; i < _poolVoteCnt; i++) {
            address _pool = _poolVote[i];
            int256 _votes = votes[_tokenId][_pool];

            if (_votes != 0) {
                _updateFor(gauges[_pool]);
                weights[_pool] -= _votes;
                votes[_tokenId][_pool] -= _votes;
                if (_votes > 0) {
                    IBribeV2(bribes[gauges[_pool]])._withdraw(
                        uint256(_votes),
                        _tokenId
                    );
                    _totalWeight += _votes;
                } else {
                    _totalWeight -= _votes;
                }
                emit Abstained(_tokenId, _votes);
            }
        }
        totalWeight -= uint256(_totalWeight);
        usedWeights[_tokenId] = 0;
        delete poolVote[_tokenId];
    }

    function poke(address _tokenId) external {
        address[] memory _poolVote = poolVote[_tokenId];
        uint256 _poolCnt = _poolVote.length;
        int256[] memory _weights = new int256[](_poolCnt);

        for (uint256 i = 0; i < _poolCnt; i++) {
            _weights[i] = votes[_tokenId][_poolVote[i]];
        }

        _vote(_tokenId, _poolVote, _weights);
    }

    function _vote(
        address _who,
        address[] memory _poolVote,
        int256[] memory _weights
    ) internal {
        _reset(_who);

        uint256 _poolCnt = _poolVote.length;

        INFTStaker staker = INFTStaker(registry.staker());
        int256 _weight = int256(staker.getVotes(_who));
        int256 _totalVoteWeight = 0;
        int256 _totalWeight = 0;
        int256 _usedWeight = 0;

        for (uint256 i = 0; i < _poolCnt; i++) {
            _totalVoteWeight += _weights[i] > 0 ? _weights[i] : -_weights[i];
        }

        for (uint256 i = 0; i < _poolCnt; i++) {
            address _pool = _poolVote[i];
            address _gauge = gauges[_pool];

            if (isGauge[_gauge]) {
                int256 _poolWeight = (_weights[i] * _weight) / _totalVoteWeight;
                require(votes[_who][_pool] == 0, "votes = 0");
                require(_poolWeight != 0, "poolweight = 0");
                _updateFor(_gauge);

                poolVote[_who].push(_pool);

                weights[_pool] += _poolWeight;
                votes[_who][_pool] += _poolWeight;
                if (_poolWeight > 0) {
                    IBribeV2(bribes[_gauge])._deposit(
                        uint256(_poolWeight),
                        _who
                    );
                } else {
                    _poolWeight = -_poolWeight;
                }
                _usedWeight += _poolWeight;
                _totalWeight += _poolWeight;
                emit Voted(msg.sender, _who, _poolWeight);
            }
        }

        totalWeight += uint256(_totalWeight);
        usedWeights[_who] = uint256(_usedWeight);
    }

    function vote(address[] calldata _poolVote, int256[] calldata _weights)
        external
    {
        require(_poolVote.length == _weights.length, "invalid weights");
        _vote(msg.sender, _poolVote, _weights);
    }

    function toggleWhitelist(address what) external onlyOwner {
        whitelist[what] = !whitelist[what];
        emit Whitelisted(msg.sender, what, whitelist[what]);
    }

    function registerGauge(
        address _pool,
        address _bribefactory,
        address _gaugefactory
    ) external onlyOwner returns (address) {
        registry.ensureNotPaused(); // ensure protocol is active

        require(gauges[_pool] == address(0x0), "gauge exists");

        // sanity checks
        require(whitelist[_pool], "pool not whitelisted");
        require(whitelist[_bribefactory], "bribe factory not whitelisted");
        require(whitelist[_gaugefactory], "gauge factory not whitelisted");

        address _bribe = IBribeFactory(_bribefactory).createBribe(
            address(registry)
        );
        address _gauge = IGaugeFactory(_gaugefactory).createGauge(
            _pool,
            _bribe,
            address(registry)
        );

        IERC20(registry.maha()).approve(_gauge, type(uint256).max);
        bribes[_gauge] = _bribe;
        gauges[_pool] = _gauge;
        poolForGauge[_gauge] = _pool;
        isGauge[_gauge] = true;

        _updateFor(_gauge);
        pools.push(_pool);

        emit GaugeCreated(_gauge, msg.sender, _bribe, _pool);
        return _gauge;
    }

    function attachTokenToGauge(address tokenId, address account)
        external
        override
        onlyGauge
    {
        // if (tokenId != address(0)) INFTLocker(registry.locker()).attach(tokenId);
        emit Attach(account, msg.sender, tokenId);
    }

    function emitDeposit(
        address account,
        uint256 amount
    ) external override onlyGauge {
        emit Deposit(account, msg.sender, amount);
    }

    function detachTokenFromGauge(address tokenId, address account)
        external
        override
        onlyGauge
    {
        // if (tokenId != address(0)) INFTLocker(registry.locker()).detach(tokenId);
        emit Detach(account, msg.sender, tokenId);
    }

    function emitWithdraw(
        address account,
        uint256 amount
    ) external override onlyGauge {
        emit Withdraw(account, msg.sender, amount);
    }

    function length() external view returns (uint256) {
        return pools.length;
    }

    function notifyRewardAmount(uint256 amount) external override {
        _safeTransferFrom(registry.maha(), msg.sender, address(this), amount); // transfer the distro in
        uint256 _ratio = (amount * 1e18) / totalWeight; // 1e18 adjustment is removed during claim
        if (_ratio > 0) {
            index += _ratio;
        }
        emit NotifyReward(msg.sender, registry.maha(), amount);
    }

    function updateFor(address[] memory _gauges) external {
        for (uint256 i = 0; i < _gauges.length; i++) {
            _updateFor(_gauges[i]);
        }
    }

    function updateForRange(uint256 start, uint256 end) public {
        for (uint256 i = start; i < end; i++) {
            _updateFor(gauges[pools[i]]);
        }
    }

    function updateAll() external {
        updateForRange(0, pools.length);
    }

    function updateGauge(address _gauge) external {
        _updateFor(_gauge);
    }

    function _updateFor(address _gauge) internal {
        address _pool = poolForGauge[_gauge];
        int256 _supplied = weights[_pool];
        if (_supplied > 0) {
            uint256 _supplyIndex = supplyIndex[_gauge];
            uint256 _index = index; // get global index0 for accumulated distro
            supplyIndex[_gauge] = _index; // update _gauge current position to global position
            uint256 _delta = _index - _supplyIndex; // see if there is any difference that need to be accrued
            if (_delta > 0) {
                uint256 _share = (uint256(_supplied) * _delta) / 1e18; // add accrued difference for each supplied token
                claimable[_gauge] += _share;
            }
        } else {
            supplyIndex[_gauge] = index; // new users are set to the default global state
        }
    }

    function claimRewards(address[] memory _gauges, address[][] memory _tokens)
        external
    {
        for (uint256 i = 0; i < _gauges.length; i++) {
            IGauge(_gauges[i]).getReward(msg.sender, _tokens[i]);
        }
    }

    function claimBribes(address[] memory _bribes, address[][] memory _tokens)
        external
    {
        for (uint256 i = 0; i < _bribes.length; i++) {
            IBribeV2(_bribes[i]).getRewardForOwner(msg.sender, _tokens[i]);
        }
    }

    function _distribute(address _gauge) internal nonReentrant {
        if (IEmissionController(emissionController).callable())
            IEmissionController(emissionController).allocateEmission();
        _updateFor(_gauge);
        uint256 _claimable = claimable[_gauge];

        if (
            _claimable > IGauge(_gauge).left(registry.maha()) &&
            _claimable / DURATION > 0
        ) {
            claimable[_gauge] = 0;
            IGauge(_gauge).notifyRewardAmount(registry.maha(), _claimable);
            emit DistributeReward(msg.sender, _gauge, _claimable);
        }
    }

    function distribute(address _gauge) external override {
        _distribute(_gauge);
    }

    function distribute() external {
        distribute(0, pools.length);
    }

    function distribute(uint256 start, uint256 finish) public {
        for (uint256 x = start; x < finish; x++) {
            _distribute(gauges[pools[x]]);
        }
    }

    function distribute(address[] memory _gauges) external {
        for (uint256 x = 0; x < _gauges.length; x++) {
            _distribute(_gauges[x]);
        }
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        require(token.code.length > 0, "invalid token code");
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(
                IERC20.transferFrom.selector,
                from,
                to,
                value
            )
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "transferFrom failed"
        );
    }
}
