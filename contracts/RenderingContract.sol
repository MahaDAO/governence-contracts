// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC2981, IERC165} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import {ITokenURIGenerator} from "./interfaces/ITokenURIGenerator.sol";
import {IRegistry} from "./interfaces/IRegistry.sol";
import {INFTLocker} from "./interfaces/INFTLocker.sol";
import {INFTStaker} from "./interfaces/INFTStaker.sol";

contract RenderingContract is ITokenURIGenerator {
    /// @dev Returns current token URI metadata
    /// @param _tokenId Token ID to fetch URI for.
    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://images.mahapeople.com/",
                    toString(_tokenId),
                    ".json"
                )
            );
    }

    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT license
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
