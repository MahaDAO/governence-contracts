import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../../utils";

async function main() {
  console.log(`deploying governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  console.log(
    `Gas Price: ${ethers.utils.formatUnits(estimateGasPrice, `gwei`)} gwei`
  );

  // Get all the deployed smart contracts.
  const registry = await getOutputAddress("Registry");
  const timelock = await getOutputAddress("MAHATimelockController-30d");

  await deployOrLoadAndVerify("MAHAXGovernorMaster", "MAHAXGovernorMaster", [
    registry,
    timelock,
    7200, // 1 day voting extension
    28800, // 4 day voting delay
    100800, // 14 day vote
    ethers.BigNumber.from(10).pow(18).mul(250), // 1000 mahax to create a vote
    ethers.BigNumber.from(10).pow(18).mul(50000), // 200k mahax quorum
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
