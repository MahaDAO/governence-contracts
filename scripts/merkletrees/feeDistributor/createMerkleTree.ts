import * as fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import Web3 from "web3";
import { BigNumber } from "ethers";

const web3 = new Web3();

type csvLine = {
  id: string;
  owner: string;
  amount: string;
};

const token = "SCLP";

const result: csvLine[] = [];
const csvPath = path.resolve(__dirname, `./stake-snapshot-${token}-v2.csv`);
const outputPath = path.resolve(__dirname, `./stake-merkleProof-${token}.json`);

const e18 = BigNumber.from(10).pow(18);

fs.createReadStream(csvPath)
  .pipe(csvParser())
  .on("data", (data: csvLine) => result.push(data))
  .on("end", () => {
    const toE18 = (a: number) => e18.mul(Math.floor(a * 1000)).div(1000);

    const constructArray = () =>
      result
        .filter((d) => Number(d.amount) > 0)
        .map((data) => {
          return {
            id: data.id,
            amount: toE18(Number(data.amount)).toString(),
            amountE18: data.amount,
          };
        })
        .filter((d) => d != null);

    const arrayData = constructArray();
    const leaves = arrayData.map((item: any) =>
      keccak256(
        web3.eth.abi.encodeParameters(
          ["uint256", "uint256"],
          [item.amount, item.id]
        )
      )
    );

    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    const ret = {
      root: merkleTree.getHexRoot(),
      leaves: arrayData.map((data, index) => ({
        data,
        proof: merkleTree.getHexProof(leaves[index]),
      })),
    };

    console.log("root", merkleTree.getHexRoot());
    fs.writeFileSync(outputPath, JSON.stringify(ret, null, 2));
    console.log("merkle tree written into", outputPath);
  });
