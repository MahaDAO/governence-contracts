// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IVoter} from "../interfaces/IVoter.sol";
import {IVotingEscrow} from "../interfaces/IVotingEscrow.sol";
import {IBribe} from "../interfaces/IBribe.sol";
import {IGauge} from "../interfaces/IGauge.sol";
import {IBribeFactory} from "../interfaces/IBribeFactory.sol";
import {IGaugeFactory} from "../interfaces/IGaugeFactory.sol";
import { IUniswapV2Pair } from "../interfaces/IUniswapV2Pair.sol";

interface IMinter {
  function update_period() external returns (uint256);
}

contract BaseV1Voter is IVoter {
  address public immutable _ve; // the IVotingEscrow token that governs these contracts
  address public immutable factory; // the BaseV1Factory
  address internal immutable base;
  address public immutable gaugefactory;
  address public immutable bribefactory;
  uint256 internal constant DURATION = 7 days; // rewards are released over 7 days
  address public minter;

  uint256 public totalWeight; // total voting weight

  address[] public pools; // all pools viable for incentives
  mapping(address => address) public gauges; // pool => gauge
  mapping(address => address) public poolForGauge; // gauge => pool
  mapping(address => address) public bribes; // gauge => bribe
  mapping(address => int256) public weights; // pool => weight
  mapping(uint256 => mapping(address => int256)) public votes; // nft => pool => votes
  mapping(uint256 => address[]) public poolVote; // nft => pools
  mapping(uint256 => uint256) public usedWeights; // nft => total voting weight of user
  mapping(address => bool) public isGauge;
  mapping(address => bool) public isWhitelisted;

  constructor(
    address __ve,
    address _factory,
    address _gauges,
    address _bribes
  ) {
    _ve = __ve;
    factory = _factory;
    base = IVotingEscrow(__ve).token();
    gaugefactory = _gauges;
    bribefactory = _bribes;
    minter = msg.sender;
  }

  function votingEscrow() external view override returns (address) {
    return _ve;
  }

  // simple re-entrancy check
  uint256 internal _unlocked = 1;
  modifier lock() {
    require(_unlocked == 1, "locked");
    _unlocked = 2;
    _;
    _unlocked = 1;
  }

  function initialize(address[] memory _tokens, address _minter) external {
    require(msg.sender == minter, "not minter");
    for (uint256 i = 0; i < _tokens.length; i++) {
      _whitelist(_tokens[i]);
    }
    minter = _minter;
  }

  function listingFee() public view returns (uint256) {
    return (IERC20(base).totalSupply() - IERC20(_ve).totalSupply()) / 200;
  }

  function reset(uint256 _tokenId) external {
    require(
      IVotingEscrow(_ve).isApprovedOrOwner(msg.sender, _tokenId),
      "not approved owner"
    );
    _reset(_tokenId);
    IVotingEscrow(_ve).abstain(_tokenId);
  }

  function _reset(uint256 _tokenId) internal {
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
          IBribe(bribes[gauges[_pool]])._withdraw(uint256(_votes), _tokenId);
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

  function poke(uint256 _tokenId) external {
    address[] memory _poolVote = poolVote[_tokenId];
    uint256 _poolCnt = _poolVote.length;
    int256[] memory _weights = new int256[](_poolCnt);

    for (uint256 i = 0; i < _poolCnt; i++) {
      _weights[i] = votes[_tokenId][_poolVote[i]];
    }

    _vote(_tokenId, _poolVote, _weights);
  }

  function _vote(
    uint256 _tokenId,
    address[] memory _poolVote,
    int256[] memory _weights
  ) internal {
    _reset(_tokenId);
    uint256 _poolCnt = _poolVote.length;
    int256 _weight = int256(IVotingEscrow(_ve).balanceOfNFT(_tokenId));
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
        require(votes[_tokenId][_pool] == 0, "votes = 0");
        require(_poolWeight != 0, "poolweight = 0");
        _updateFor(_gauge);

        poolVote[_tokenId].push(_pool);

        weights[_pool] += _poolWeight;
        votes[_tokenId][_pool] += _poolWeight;
        if (_poolWeight > 0) {
          IBribe(bribes[_gauge])._deposit(uint256(_poolWeight), _tokenId);
        } else {
          _poolWeight = -_poolWeight;
        }
        _usedWeight += _poolWeight;
        _totalWeight += _poolWeight;
        emit Voted(msg.sender, _tokenId, _poolWeight);
      }
    }
    if (_usedWeight > 0) IVotingEscrow(_ve).voting(_tokenId);
    totalWeight += uint256(_totalWeight);
    usedWeights[_tokenId] = uint256(_usedWeight);
  }

  function vote(
    uint256 tokenId,
    address[] calldata _poolVote,
    int256[] calldata _weights
  ) external {
    require(
      IVotingEscrow(_ve).isApprovedOrOwner(msg.sender, tokenId),
      "not token owner"
    );
    require(_poolVote.length == _weights.length, "invalid weights");
    _vote(tokenId, _poolVote, _weights);
  }

  function whitelist(address _token, uint256 _tokenId) public {
    if (_tokenId > 0) {
      require(msg.sender == IVotingEscrow(_ve).ownerOf(_tokenId), "not owner");
      require(
        IVotingEscrow(_ve).balanceOfNFT(_tokenId) > listingFee(),
        "not enough listing fee"
      );
    } else {
      _safeTransferFrom(base, msg.sender, minter, listingFee());
    }

    _whitelist(_token);
  }

  function _whitelist(address _token) internal {
    require(!isWhitelisted[_token], "already whitelisted");
    isWhitelisted[_token] = true;
    emit Whitelisted(msg.sender, _token);
  }

  function createGauge(address _pool) external returns (address) {
    require(gauges[_pool] == address(0x0), "gauge exists");
    require(IUniswapV2Pair(_pool).factory() == factory, "is not pool factory");
    address tokenA = IUniswapV2Pair(_pool).token0();
    address tokenB = IUniswapV2Pair(_pool).token1();
    require(isWhitelisted[tokenA] && isWhitelisted[tokenB], "!whitelisted");
    address _bribe = IBribeFactory(bribefactory).createBribe();
    address _gauge = IGaugeFactory(gaugefactory).createGauge(
      _pool,
      _bribe,
      _ve
    );
    IERC20(base).approve(_gauge, type(uint256).max);
    bribes[_gauge] = _bribe;
    gauges[_pool] = _gauge;
    poolForGauge[_gauge] = _pool;
    isGauge[_gauge] = true;
    _updateFor(_gauge);
    pools.push(_pool);
    emit GaugeCreated(_gauge, msg.sender, _bribe, _pool);
    return _gauge;
  }

  function attachTokenToGauge(uint256 tokenId, address account)
    external
    override
  {
    require(isGauge[msg.sender], "not gauge");
    if (tokenId > 0) IVotingEscrow(_ve).attach(tokenId);
    emit Attach(account, msg.sender, tokenId);
  }

  function emitDeposit(
    uint256 tokenId,
    address account,
    uint256 amount
  ) external override {
    require(isGauge[msg.sender], "not gauge");
    emit Deposit(account, msg.sender, tokenId, amount);
  }

  function detachTokenFromGauge(uint256 tokenId, address account)
    external
    override
  {
    require(isGauge[msg.sender], "not gauge");
    if (tokenId > 0) IVotingEscrow(_ve).detach(tokenId);
    emit Detach(account, msg.sender, tokenId);
  }

  function emitWithdraw(
    uint256 tokenId,
    address account,
    uint256 amount
  ) external override {
    require(isGauge[msg.sender], "not gauge");
    emit Withdraw(account, msg.sender, tokenId, amount);
  }

  function length() external view returns (uint256) {
    return pools.length;
  }

  uint256 internal index;
  mapping(address => uint256) internal supplyIndex;
  mapping(address => uint256) public claimable;

  function notifyRewardAmount(uint256 amount) external {
    _safeTransferFrom(base, msg.sender, address(this), amount); // transfer the distro in
    uint256 _ratio = (amount * 1e18) / totalWeight; // 1e18 adjustment is removed during claim
    if (_ratio > 0) {
      index += _ratio;
    }
    emit NotifyReward(msg.sender, base, amount);
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

  function claimBribes(
    address[] memory _bribes,
    address[][] memory _tokens,
    uint256 _tokenId
  ) external {
    require(
      IVotingEscrow(_ve).isApprovedOrOwner(msg.sender, _tokenId),
      "not approved owner"
    );
    for (uint256 i = 0; i < _bribes.length; i++) {
      IBribe(_bribes[i]).getRewardForOwner(_tokenId, _tokens[i]);
    }
  }

  function _distribute(address _gauge) internal lock {
    IMinter(minter).update_period();
    _updateFor(_gauge);
    uint256 _claimable = claimable[_gauge];
    if (_claimable > IGauge(_gauge).left(base) && _claimable / DURATION > 0) {
      claimable[_gauge] = 0;
      IGauge(_gauge).notifyRewardAmount(base, _claimable);
      emit DistributeReward(msg.sender, _gauge, _claimable);
    }
  }

  function distribute(address _gauge) external override {
    _distribute(_gauge);
  }

  function distro() external {
    distribute(0, pools.length);
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
      abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
    );
    require(
      success && (data.length == 0 || abi.decode(data, (bool))),
      "transferFrom failed"
    );
  }
}
