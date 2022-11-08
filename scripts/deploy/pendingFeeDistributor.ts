import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const token = "SCLP";
  const _merkleRoot =
    "0xc3c86b1fc1994656a4b1e8cd426aab572faac034a85526be797fe55f4391b08b";

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
