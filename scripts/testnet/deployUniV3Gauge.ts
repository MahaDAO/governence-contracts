import * as fs from "fs";
import hre, { ethers, network } from "hardhat";

import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  const PROXY_ADMIN = "0xed74d7941EFb3aec09C02a2db41BCBf195c9216b";
  console.log(
    `Deployer address is ${deployer.address}, Proxy admin is ${PROXY_ADMIN}`
  );

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // Get all smart contract factories
  const univ3GaugeContractFactory = await ethers.getContractFactory(
    "BaseGaugeV2UniV3"
  );
  const bribesContractFactory = await ethers.getContractFactory("BaseV2Bribes");

  // Get all the deployed smart contracts.
  const voter = await ethers.getContractAt(
    "BaseV2Voter",
    "0x84352AE3a54C98d8DD9753c553b2d60DF66914e6"
  );
  const registry = await ethers.getContractAt(
    "Registry",
    "0x6726827420b42B1C8A07ceCc480a77b3397e87f8"
  );
  const poolAddr = "0x7160dD61d95Ec9460FC84a318dEB3ce6B2c0a75f";

  const mahaCI = await ethers.getContractAt(
    "MockERC20",
    "0xAaA6a7A5d7eC7C7691576D557E1D2CDaBeca6C4A"
  );
  const solidCI = await ethers.getContractAt(
    "MockERC20",
    "0xD09cb6c1aAb18239B7C0880BFcfaAbca461cBac3"
  );
  const daiCI = await ethers.getContractAt(
    "MockERC20",
    "0xbAE4E07480f16d82Bc13850C36631C21861E245b"
  );
  const usdcCI = await ethers.getContractAt(
    "MockERC20",
    "0x3e922459b8D5956E3c886aCA472688F811821F6b"
  );

  const univ3GaugeContractInstance = await univ3GaugeContractFactory.deploy(
    poolAddr,
    registry.address,
    deployer.address,
    "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    { gasPrice }
  );

  await univ3GaugeContractInstance.deployed();

  const bribesInstance = await bribesContractFactory.deploy(registry.address, {
    gasPrice,
  });
  await bribesInstance.deployed();

  console.log("G", univ3GaugeContractInstance.address);
  console.log("B", bribesInstance.address);

  await verifyContract(hre, univ3GaugeContractInstance.address, [
    poolAddr,
    registry.address,
    deployer.address,
    "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  ]);

  await verifyContract(hre, bribesInstance.address, [registry.address]);

  let tx = await voter.toggleWhitelist(poolAddr, { gasPrice });
  await tx.wait();
  tx = await voter.toggleWhitelist(univ3GaugeContractInstance.address, {
    gasPrice,
  });
  await tx.wait();
  tx = await voter.toggleWhitelist(bribesInstance.address, {
    gasPrice,
  });
  await tx.wait();

  tx = await voter.registerGauge(
    poolAddr,
    bribesInstance.address,
    univ3GaugeContractInstance.address,
    { gasPrice }
  );
  await tx.wait();

  // Mint fee to fee distributors.
  console.log(`Minting MAHA to Fee distributor`);
  await mahaCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e8),
    { gasPrice }
  );
  console.log(`Minting DAI to Fee distributor`);
  await daiCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e8),
    { gasPrice }
  );
  console.log(`Minting SOLID to Fee distributor`);
  await solidCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(18).mul(1e8),
    { gasPrice }
  );
  console.log(`Minting USDC to Fee distributor`);
  await usdcCI.mint(
    deployer.address,
    ethers.BigNumber.from(10).pow(6).mul(1e8),
    { gasPrice }
  );

  console.log(`Governance deployment on ${network.name} complete.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
