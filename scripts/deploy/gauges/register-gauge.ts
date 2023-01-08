import { ethers } from "hardhat";
import { saveABI, deployOrLoadAndVerify, getOutputAddress } from "../../utils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const registry = await getOutputAddress("Registry");
  const proxyAdmin = await getOutputAddress("MAHATimelockController-30d");
  const voterAdmin = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC"; // await getOutputAddress("MAHATimelockController-14d");

  const voter = await deployOrLoadAndVerify(`BaseV2Voter`, "BaseV2Voter", []);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
