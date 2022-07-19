# MahaDAO Governance Contracts

This repository contains the smart-contracts that are responsible for MahaDAO's governance. This includes voting, staking, gauges and bribes.

- [Registry.sol](./contracts/Registry.sol): This contract holds the addresses of all the deployed contracts and is referenced by the various components. [Etherscan](https://etherscan.io/address/0x270Cb299Bd822A856c0599235b3ABdd1B42afe85)
- [MAHAXLocker.sol](./contracts/MAHAXLocker.sol): This contract locks MAHA and mints a NFT for every lock. [Etherscan](https://etherscan.io/address/0x2dd0b4BcD086DC603e864A898c9125d2c22F00D4)
- [MAHAXStaker.sol](./contracts/voter/MAHAXStaker.sol): This contract tracks votes for every address whenever a user stakes his/her NFT. [Etherscan](https://etherscan.io/address/0x40203FABB70d382797A2c544dAe4793202931988)
- [MAHAXGovernor.sol](./contracts/MAHAXGovernor.sol): Openzepplin's governor contract that creates and executes proposals. [Etherscan](https://etherscan.io/address/0x8B02998366F7437F6c4138F4b543EA5c000cD608)
- [BaseV2Voter.sol](./contracts/voter/BaseV2Voter.sol): This contract is responsible for tracking votes for every address.
