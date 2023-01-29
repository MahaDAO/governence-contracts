import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../../utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const token = "MAHA";
  const _merkleRoot =
    "0x865730c4a374e78f7f2d6d98afb629a38bb34e5cf9b36c9c361d7576d3fd8d62";

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
