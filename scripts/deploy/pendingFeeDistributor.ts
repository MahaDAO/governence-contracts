import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const token = "MAHA";
  const _merkleRoot =
    "0x05d2dd3ff3928a8e5f8d6dbbc35d02afe88d51c05e2a1c6f8c10638fb57917c5";

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
