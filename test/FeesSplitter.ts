import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { FeesSplitter, MockERC20 } from "../typechain";

describe("FeesSplitter", async () => {
  let split: FeesSplitter;
  let erc20: MockERC20;
  let deployer: SignerWithAddress;

  const accounts = [
    "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC",
    "0x5C677239f33B6761B1C24259a6ffDB36574d4496",
  ];

  const ghost = "0xd9333E02a4d85611D0F0498b858b2Ae3c29dE6Fb";

  const e18 = BigNumber.from(10).pow(18);
  const e6 = BigNumber.from(10).pow(6);
  const percentages = [e6.mul(4).div(5), e6.div(5)];

  beforeEach(async function () {
    const erc20Factory = await ethers.getContractFactory("MockERC20");
    const splitFactory = await ethers.getContractFactory("FeesSplitter");
    [deployer] = await ethers.getSigners();

    split = await splitFactory.deploy(accounts, percentages);
    erc20 = await erc20Factory.deploy("ERC20", "ERC20", 18);
  });

  it("deploy addresses properly", async function () {
    expect(await split.accounts(0)).eq(accounts[0]);
    expect(await split.accounts(1)).eq(accounts[1]);
    // expect(await split.accounts(2)).reverted();
  });

  it("deploy percentages properly", async function () {
    expect(await split.percentAllocations(0)).eq(percentages[0]);
    expect(await split.percentAllocations(1)).eq(percentages[1]);
    // expect(await split.accounts(2)).eq(accounts[1]);
  });

  it("split erc20 tokens properly", async function () {
    // send 100 tokens
    await erc20.transfer(split.address, e18.mul(100));
    expect(await erc20.balanceOf(split.address)).eq(e18.mul(100));

    // execute the split
    await split.distributeERC20(erc20.address);

    // check balances
    expect(await erc20.balanceOf(split.address)).eq(0);
    expect(await erc20.balanceOf(accounts[0])).eq(e18.mul(80));
    expect(await erc20.balanceOf(accounts[1])).eq(e18.mul(20));
  });

  it("split eth properly", async function () {
    // send 1 eth
    await deployer.sendTransaction({
      to: split.address,
      value: e18.mul(10),
    });

    expect(await ethers.provider.getBalance(split.address)).eq(e18.mul(10));

    // execute the split
    await split.distributeETH();

    // check balances
    expect(await ethers.provider.getBalance(split.address)).eq(0);
    expect(await ethers.provider.getBalance(accounts[0])).eq(e18.mul(8));
    expect(await ethers.provider.getBalance(accounts[1])).eq(e18.mul(2));
  });

  describe("on new split addresses and amounts", async () => {
    const accountsWghost = [...accounts, ghost];
    const percentagesWghost = [e6.mul(8).div(10), e6.div(10), e6.div(10)];

    beforeEach(async function () {
      await split.updateSplit(accountsWghost, percentagesWghost);
    });

    it("deploy addresses properly", async function () {
      expect(await split.accounts(0)).eq(accounts[0]);
      expect(await split.accounts(1)).eq(accounts[1]);
      expect(await split.accounts(2)).eq(ghost);
    });

    it("throw an error with invalid split percentage ", async function () {
      const invalidPercentage = [e6.mul(8).div(10), e6.div(100), 0];

      await expect(
        split.updateSplit(accountsWghost, invalidPercentage)
      ).revertedWith("invalid percentages");
    });

    it("split erc20 tokens properly", async function () {
      // send 100 tokens
      await erc20.transfer(split.address, e18.mul(100));
      expect(await erc20.balanceOf(split.address)).eq(e18.mul(100));

      // execute the split
      await split.distributeERC20(erc20.address);

      // check balances
      expect(await erc20.balanceOf(split.address)).eq(0);
      expect(await erc20.balanceOf(accounts[0])).eq(e18.mul(80));
      expect(await erc20.balanceOf(accounts[1])).eq(e18.mul(10));
      expect(await erc20.balanceOf(ghost)).eq(e18.mul(10));
    });
  });
});
