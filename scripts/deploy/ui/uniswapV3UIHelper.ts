import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify } from "../../utils";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const helper = await deployOrLoadAndVerify(
    "UniswapV3UIHelper",
    "UniswapV3UIHelper",
    [uniPositionManager]
  );

  console.log(
    "boosted factor",
    await helper.boostedFactor(
      "0x7bb5bf0be8cb2d3f884389c0cadeef7b5f05e1c8", // gauge
      411235, // tokenid
      "0x77cd66d59ac48a0e7ce54ff16d9235a5ffff335e" // who
    )
  );
  console.log("is in range", await helper.isInRange(411235));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
