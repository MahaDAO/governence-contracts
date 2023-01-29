import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../../utils";

async function main() {
  console.log(`Deploying migrator to ${network.name}`);

  const tokenSymbol = "MAHA";

  const [deployer] = await ethers.getSigners();
  const gaugeProxyAdmin = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC";

  console.log(`deployer address is ${deployer.address}`);

  const pendingFeeDistributor = await getOutputAddress(
    `${tokenSymbol}PendingFeeDistributor`
  );

  const implementation = await deployOrLoadAndVerify(
    `FeeDistributor-Impl`,
    "FeeDistributor",
    []
  );

  const FeeDistributor = await ethers.getContractFactory("FeeDistributor");
  const initData = FeeDistributor.interface.encodeFunctionData("initialize", [
    await getOutputAddress("MAHAXLocker"), // address _votingEscrow,
    await getOutputAddress(tokenSymbol), // address _token,
    pendingFeeDistributor, // address _pendingFeeDistributor
  ]);

  await deployOrLoadAndVerify(
    `${tokenSymbol}FeeDistributor`,
    "TransparentUpgradeableProxy",
    [implementation.address, gaugeProxyAdmin, initData]
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
