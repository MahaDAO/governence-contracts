import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const token = "SCLP";
  const _merkleRoot =
    "0x30791d15d7dea3fd38f0628428e4f9c436c975364f77c23deb7d4791057f18e6";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  await deployOrLoadAndVerify(
    `${token}PendingFeeDistributor`,
    "PendingFeeDistributor",
    [
      _merkleRoot,
      await getOutputAddress(token, "ethereum"),
      "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC",
      await getOutputAddress("MAHAXLocker", "ethereum"),
    ]
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
