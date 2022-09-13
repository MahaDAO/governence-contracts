import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`deploying veto governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  console.log(
    `Gas Price: ${ethers.utils.formatUnits(estimateGasPrice, `gwei`)} gwei`
  );

  // Get all the deployed smart contracts.
  const registry = await getOutputAddress("Registry");
  const timelock = await getOutputAddress("TimelockController");

  await deployOrLoadAndVerify("MAHAXVetoGovernor", "MAHAXVetoGovernor", [
    registry,
    timelock,
    1, // 0 day voting delay
    26182, // 4 day
    ethers.BigNumber.from(10).pow(18).mul(1000), // 1000 mahax min threshold
    ethers.BigNumber.from(10).pow(18).mul(150000), // 150k mahax quorum
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
