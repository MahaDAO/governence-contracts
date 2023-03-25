import {
  impersonateAccount,
  setBalance,
} from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress } from "../../utils";

async function main() {
  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const poolAddr = await getOutputAddress("ARTHMAHA-UniV3-Pool");
  const gaugeAddr = "0x98e1701F6558Dd63481B57926c9F22c64d918C35";

  const jaffAddr = "0xDFc4D86c6AE7fE48d995246557368519447E6387";
  const deployerAddr = "0x77cd66d59ac48a0E7CE54fF16D9235a5fffF335E";
  const gnosisAddr = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC";

  const nftId1 = 457519;
  const nftId2 = 459075;

  await impersonateAccount(jaffAddr);
  await impersonateAccount(gnosisAddr);
  await impersonateAccount(deployerAddr);

  const uniswapNft = await ethers.getContractAt(
    "INonfungiblePositionManager",
    uniPositionManager
  );

  const gauge = await ethers.getContractAt("GaugeUniswapV3", gaugeAddr);
  const proxy = await ethers.getContractAt(
    "TransparentUpgradeableProxy",
    gaugeAddr
  );

  await setBalance(gnosisAddr, "0x56BC75E2D63100000");
  await setBalance(jaffAddr, "0x56BC75E2D63100000");
  await setBalance(deployerAddr, "0x56BC75E2D63100000");

  const jaff = await ethers.getSigner(jaffAddr);
  const gnosis = await ethers.getSigner(gnosisAddr);
  const deployer = await ethers.getSigner(deployerAddr);

  const BaseGaugeV3UniV3 = await ethers.getContractFactory("GaugeUniswapV3");
  const impl = await BaseGaugeV3UniV3.deploy();

  console.log(`Deployer address is ${deployer.address}`);

  console.log("earned id 1", await gauge.earned(nftId1));
  console.log("earned id 2", await gauge.earned(nftId2));

  // update impl
  console.log("---");
  console.log("update impl", impl.address);
  console.log("impl", await proxy.implementation());
  console.log("version", await gauge.getRevision());
  await proxy.connect(gnosis).upgradeTo(impl.address);
  console.log("---");
  console.log("impl", await proxy.implementation());
  console.log("version", await gauge.getRevision());
  console.log("canInitialize", await gauge.canInitialize());
  console.log("---");

  console.log("staking nft id 2");
  await uniswapNft
    .connect(jaff)
    ["safeTransferFrom(address,address,uint256)"](
      jaff.address,
      gauge.address,
      nftId2
    );

  // step 0 - nft id 1 -> gauge
  // step 2 - nft id 2 -> gauge
  // step 3 - get rewards

  // await network.provider.send("evm_mine", [1678298519]); // add one day

  console.log("earned id 1", await gauge.earned(nftId1));
  console.log("earned id 2", await gauge.earned(nftId2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
