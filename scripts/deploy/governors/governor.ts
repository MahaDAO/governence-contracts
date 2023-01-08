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
  const timelock = await getOutputAddress("TimelockController");

  await deployOrLoadAndVerify("MAHAXGovernor", "MAHAXGovernor", [
    registry,
    timelock,
    6545, // 1 day voting extension
    6545, // 1 day voting delay
    26182, // 4 day
    ethers.BigNumber.from(10).pow(18).mul(250), // 250 mahax
    ethers.BigNumber.from(10).pow(18).mul(50000), // 50k mahax quorum
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
