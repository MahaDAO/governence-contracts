import { ethers } from "hardhat";
import { saveABI, deployOrLoadAndVerify, getOutputAddress } from "../../utils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const registry = await getOutputAddress("Registry");
  const proxyAdmin = await getOutputAddress("MAHATimelockController-30d");
  const voterAdmin = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC"; // await getOutputAddress("MAHATimelockController-14d");

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
    voterAdmin,
  ]);

  const proxy = await deployOrLoadAndVerify(
    "BaseV2VoterProxy",
    "TransparentUpgradeableProxy",
    [implementation.address, proxyAdmin, initDecode]
  );

  console.log("implementation", implementation.address);
  console.log("proxy", proxy.address);

  await saveABI("BaseV2Voter", "BaseV2Voter", proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
