import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying LP gauge to ${network.name}`);

  const tokenAddr = "0xbcceb5b710e3eb07d1ac6a079e87d799be30a71f";
  const tokenA = "ARTH";
  const tokenB = "3pool";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  // const voter = await ethers.getContractAt(
  //   "BaseV2Voter",
  //   await getOutputAddress("GaugeVoter")
  // );

  const registry = await ethers.getContractAt(
    "Registry",
    await getOutputAddress("Registry")
  );

  const gaugeInstance = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-LpGauge`,
    "BaseGaugeV2",
    [tokenAddr, registry.address]
  );

  const bribesInstance = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-LpBribe`,
    "BaseV2Bribes",
    [registry.address]
  );

  console.log("gaugeContractInstance", gaugeInstance.address);
  console.log("bribesInstance", bribesInstance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
