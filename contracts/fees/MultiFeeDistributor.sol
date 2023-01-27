// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IFeeDistributor} from "../interfaces/IFeeDistributor.sol";

contract MultiFeeDistributor {
    function claimMany(
        uint256[] memory nftIds,
        IFeeDistributor[] memory distributors
    ) external returns (uint256[] memory) {
        uint256[] memory ret = new uint256[](nftIds.length);

        for (uint256 index = 0; index < nftIds.length; index++) {
            ret[index] = distributors[index].claim(nftIds[index]);
        }

        return ret;
    }

    function claimManyWithProofs(
        bytes[] memory data,
        IFeeDistributor[] memory distributors
    ) external returns (uint256[] memory) {
        uint256[] memory ret = new uint256[](data.length);

        for (uint256 index = 0; index < data.length; index++) {
            (uint256 nftId, uint256 _reward, bytes32[] memory _proof) = abi
                .decode(data[index], (uint256, uint256, bytes32[]));
            ret[index] = distributors[index].claimWithPendingRewards(
                nftId,
                _reward,
                _proof
            );
        }

        return ret;
    }
}
