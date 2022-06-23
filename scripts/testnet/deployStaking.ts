import * as fs from "fs";
import hre, { ethers, network } from "hardhat";

import { ZERO_ADDRESS } from "../config";
import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // ----- Get the smart contract factories -----

  const stakingMasterCF = await ethers.getContractFactory(`StakingMaster`);
  const stakingChildCF = await ethers.getContractFactory(`StakingChild`);
  const stakingCollectorCF = await ethers.getContractFactory(
    `StakingCollector`
  );

  // ----- Fetch pre-existing contracts.

  const mahaCI = await ethers.getContractAt(
    "MockERC20",
    "0x7aF163582b3ebAAbB7bce03aaDa8C1d76d655a5c"
  );

  const daiCI = await ethers.getContractAt(
    "MockERC20",
    "0x544380B5EE3d1a8485671537a553F61f3c7190f1"
  );

  const votingEscrowAddress = "0x2fb4ae886A74e3F9AB5970a10C7c104f81e25087";

  // ----- Deploy smart contracts -----

  const stakingMasterCI = await stakingMasterCF.deploy(
    deployer.address,
    votingEscrowAddress,
    { gasPrice }
  );
  console.log(`Staking master deployed at: ${stakingMasterCI.address}`);
  await verifyContract(hre, stakingMasterCI.address, [
    deployer.address,
    votingEscrowAddress,
  ]);

  const stakingCollectorCI = await stakingCollectorCF.deploy(1 * 60 * 60, {
    gasPrice,
  });
  console.log(`Staking collector deployed at: ${stakingCollectorCI.address}`);
  await verifyContract(hre, stakingCollectorCI.address, [1 * 60 * 60]);

  const mahastakingChildCI = await stakingChildCF.deploy(
    mahaCI.address,
    stakingMasterCI.address,
    stakingCollectorCI.address,
    7 * 24 * 60 * 60,
    { gasPrice }
  );
  console.log(`MAHA Staking child deployed at: ${mahastakingChildCI.address}`);
  await verifyContract(hre, mahastakingChildCI.address, [
    mahaCI.address,
    stakingMasterCI.address,
    stakingCollectorCI.address,
    7 * 24 * 60 * 60,
  ]);

  const daistakingChildCI = await stakingChildCF.deploy(
    daiCI.address,
    stakingMasterCI.address,
    stakingCollectorCI.address,
    7 * 24 * 60 * 60,
    { gasPrice }
  );
  console.log(`DAI staking child deployed at: ${daistakingChildCI.address}`);
  await verifyContract(hre, daistakingChildCI.address, [
    daiCI.address,
    stakingMasterCI.address,
    stakingCollectorCI.address,
    7 * 24 * 60 * 60,
  ]);

  await stakingMasterCI.addPools([
    mahastakingChildCI.address,
    daistakingChildCI.address,
  ]);

  await stakingCollectorCI.registerToken(
    mahaCI.address,
    "1154000000000000000000",
    mahastakingChildCI.address
  );
  await stakingCollectorCI.registerToken(
    daiCI.address,
    "1154000000000000000000",
    daistakingChildCI.address
  );
  await mahaCI.mint(
    stakingCollectorCI.address,
    "115400000000000000000000000000000"
  );
  await daiCI.mint(
    stakingCollectorCI.address,
    "115400000000000000000000000000000"
  );
  await stakingCollectorCI.step();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
