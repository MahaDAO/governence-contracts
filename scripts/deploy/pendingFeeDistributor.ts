import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const token = "SCLP";
  const _merkleRoot =
    "0x0583689ef16778f7e60c8fb20bdefed728e78bfeae1c51851988ff2ca83c22e6";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  await deployOrLoadAndVerify(
    `${token}PendingFeeDistributor`,
    "PendingFeeDistributor",
    [_merkleRoot, await getOutputAddress(token)]
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
