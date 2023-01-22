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
    "amountsStaked",
    await helper.amountsStaked(
      "0x98e1701f6558dd63481b57926c9f22c64d918c35" // gauge
    )
  );

  console.log(
    "totalAmountsStaked",
    await helper.totalAmountsStaked(
      "0x98e1701f6558dd63481b57926c9f22c64d918c35" // gauge
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
