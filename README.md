# MahaDAO Governance Contracts

This repository contains the smart-contracts that are responsible for MahaDAO's governance. This includes voting, staking, gauges and pool incentives.

- [Registry.sol](./contracts/Registry.sol): This contract holds the addresses of all the deployed contracts and is referenced by the various components. [Etherscan](https://etherscan.io/address/0x2684861ba9dada685a11c4e9e5aed8630f08afe0)
- [MAHAXLocker.sol](./contracts/MAHAXLocker.sol): This contract locks `MAHA` and mints a NFT for every lock. [Etherscan](https://etherscan.io/address/0xbdD8F4dAF71C2cB16ccE7e54BB81ef3cfcF5AAcb)
- [MAHAXStaker.sol](./contracts/MAHAXStaker.sol): This contract tracks votes for every address whenever a user stakes his/her NFT. [Etherscan](https://etherscan.io/address/0x608917F8392634428Ec71C6766F3eC3f5cc8f421)
- [MAHAXGovernor.sol](./contracts/MAHAXGovernor.sol): Openzepplin's governor contract that creates and executes proposals. [Etherscan](https://etherscan.io/address/0xffec018583152ab5f056c5323f1f68b701bf1bc5)
- [BaseV2Voter.sol](./contracts/voter/BaseV2Voter.sol): This contract is responsible for tracking votes for every address. [Etherscan](https://etherscan.io/address/0xFbbe448D38231c298E9A2251bc0c567543e2ccA6)
- [LockMigrator.sol](./contracts/LockMigrator.sol): A migrator contract with permissions to mint NFTs that match a merkle proof. [Etherescan](https://etherscan.io/address/0xb180B2e4821e99a69d19f0845D2cc572eA412481)

## Deployment Instructions

For deployment to mainnet run the following script.

```
yarn install
yarn compile
npx hardhat run scripts/mainnet/deploy.ts --network <network>
```

You'd need to keep a file in the `./deployments/<network>.json` folder with all ERC20 token addresses that you'll use. See [`template.json`](./deployments/template.json) for a reference on what to start with.

Also keep a `.env` file with values mentioned in the [`.env.example`](./.env.example) file.

# Contracts Overview

The governance contracts was built keeping in mind security and upgradability for future robustness of the governance. In this section we describe what each contracts does and if there's any special attention that should be given to it.

## Registry.sol

This contract maintains the registry of all contract addresses. It used to allow for an easy way of upgrading the various components of the govenrance. In the unlikely event there is a bug or one of the contract needs to be upgraded, an update to the `Registry` will update the reference for all the other currently deployed contracts.

The contracts contains functionality to pause governance by an address that has the `EMERGENCY_STOP_ROLE` role. This is used in the unlikely event that governance itself has been compromised and the protocol needs to wind down.

The registry maintains the a reference to the following contracts:

[Registry.sol](./contracts/Regsitry.sol) - [Etherscan](https://etherscan.io/address/0x2684861ba9dada685a11c4e9e5aed8630f08afe0)

## MAHAXLocker.sol

This contract (also called as the locker) locks `MAHA` and mints a NFT for every lock.

Upon interacting with the locks (minting, burning, extending the lock or increasing the `MAHA`), a call to the `MAHAXStaker` contract is made, allowing a user to stake or update his stake in the same transaction itself.

Furthermore, the locker also checks the `MAHAXStaker` contract to understand if the NFT has staked. If a NFT is staked, then a user:

- Cannot transfer the NFT
- Cannot withdraw the underlying `MAHA`
- Cannot merge the NFT with another one

### Calculating MAHAX

Every user that locks their `MAHA` gets a balance assigned to them. This balance represents their voting and it decays over time (from a max period of 4 years).
The locker returns this balance by calling the `balanceOf(...)` function which calculates using a linear function that takes into account current time, lock duration and lock amount.

The maximum duration a user can lock for is `4 years`. There is no upper limit for the amount of `MAHA` that can be lcoked however there is a minimum amount of `100 MAHAX` that a NFT needs to maintain. This can be changed at any time by the governance. Lock expiry times are rounded off by the week and the minimum lock time can be `1 week`.

### NFTs and Staking

Each `MAHA` lock is represented as a NFT which is carries the details about the lock such as amount and expiry date. NFTs can be moved around which means a NFT holder that locks their MAHA can also transfer the lock to another wallet by simply transferring their NFT.

NFTs can be staked onto the `MAHAXStaker` contract which allows the NFT holder to access other utilities such as fees and voting from the protocol.

### Emergency Refund

The locker contract contains an `emergencyRefund()` which is used to refund all the `MAHA` in the contract in the unlikely event of an emergency. This function can only be called by governance and can be disabled for good by calling the `stopBootstrapMode()` function which triggers a flag that disables the `emergencyRefund()` function. In the unlikely event that there is a flaw in the locker's business logic, this function can be called as part of the migration process to a new governance implementation. The moment there is enough confidence in the contract's business logic, the `stopBootstrapMode()` can be called by the community and the `emergencyRefund()` will become disabled permanently.

Considering a modular approach, in an unlikely event that other smart contracts within the governance fails to function, the locker contract should still be able to mint, burn and allow users to withdraw their `MAHA` without any issues.

[MAHAXLocker.sol](./contracts/MAHAXLocker.sol) - [Etherscan](https://etherscan.io/address/0xbdD8F4dAF71C2cB16ccE7e54BB81ef3cfcF5AAcb)

## MAHAXStaker.sol

This contract's main purpose is to stake NFTs, calculating voting power and allow for delegation to happen. It has functions to unstake and stake which can get called by a user and also a function called `_stakeFromLock(..)` which is called by the `MAHAXLocker.sol` whenever (for example) it decides to stake a NFT in the same transaction as minitng a NFT.

[MAHAXStaker.sol](./contracts/MAHAXStaker.sol) - [Etherscan](https://etherscan.io/address/0x608917F8392634428Ec71C6766F3eC3f5cc8f421)
