# MahaDAO Governance Contracts

This repository contains the smart-contracts that are responsible for MahaDAO's governance. This includes voting, staking, gauges and bribes.

- [MAHAX.sol](./contracts/MAHAX.sol): This contract locks MAHA and mints a NFT for every lock.
- [MAHAXGovernor.sol](./contracts/MAHAXGovernor.sol): Openzepplin's governor contract that creates and executes proposals.
- [BaseV2Voter.sol](./contracts/voter/BaseV2Voter.sol): This contract is responsible for tracking votes for every address.
