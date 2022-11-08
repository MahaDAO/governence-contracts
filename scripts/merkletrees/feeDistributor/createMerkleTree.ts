import * as fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import Web3 from "web3";

const web3 = new Web3();

type csvLine = {
  id: string;
  owner: string;
  amount: string;
};

const token = "SCLP";

const result: csvLine[] = [];
const csvPath = path.resolve(__dirname, `./stake-snapshot-${token}.csv`);
const outputPath = path.resolve(__dirname, `./stake-merkleProof-${token}.json`);

fs.createReadStream(csvPath)
  .pipe(csvParser())
  .on("data", (data: csvLine) => result.push(data))
  .on("end", () => {
    const constructArray = () =>
      result
        .filter((d) => Number(d.amount) > 0)
        .map((data) => {
          return {
            owner: data.owner,
            id: data.id,
            amount: data.amount,
          };
        })
        .filter((d) => d != null);

    const arrayData = constructArray();
    const leaves = arrayData.map((item: any) =>
      keccak256(
        web3.eth.abi.encodeParameters(
          ["address", "uint256", "uint256"],
          [item.owner, item.amount, item.id]
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
