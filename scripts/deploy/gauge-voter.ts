import { ethers } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  // const voter = await ethers.getContractAt(
  //   "BaseV2Voter",
  //   await getOutputAddress("GaugeVoter")
  // );

  const registry = await getOutputAddress("Registry");

  console.log("Deploying BaseV2Voter...");
  const BaseV2Voter = await ethers.getContractFactory("BaseV2Voter");
  const implementation = await deployOrLoadAndVerify(
    `BaseV2VoterImpl`,
    "BaseV2Voter",
    []
  );

  // deploy as proxy
  console.log("Deploying proxy...");
  const initDecode = BaseV2Voter.interface.encodeFunctionData("initialize", [
    registry,
    deployer.address,
    deployer.address,
  ]);

  const proxy = await deployOrLoadAndVerify(
    "BaseV2Voter",
    "TransparentUpgradeableProxy",
    [implementation.address, config.gnosisProxy, initDecode]
  );

  console.log("gaugeContractInstance", gaugeInstance.address);
  console.log("bribesInstance", implementation.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
