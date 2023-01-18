import logo from './logo.svg';
import './App.css';
import { Connection, PublicKey } from "@solana/web3.js";
import * as web3 from '@solana/web3.js';
import { useEffect, useState } from 'react';
import nftImage from './nftImage.png'
import { Creator, dataURLtoFile, mintNFT } from './utils/nftCreation';
import domToImage from 'dom-to-image';
import { burn } from './utils/nftBurn';
import {programIds} from './utils/programIds'
const NETWORK = web3.clusterApiUrl("testnet");
const connection = new Connection(NETWORK);

function App() {

  const [provider, setProvider] = useState()
  const [nftUrl, setNftUrl] = useState("https://storage.googleapis.com/fractal-launchpad-public-assets/tinycolony-chars/assets/9875.json")
  const [providerPubKey, setProviderPub] = useState()
  const [nftDetails, setNftDetails] = useState({})
  const [nftBurnSignature, setNftBurnSignature] = useState()

  const convertDOMtoBase64 = async () => {
  const node = document.getElementById('nftImage');
  return domToImage.toPng(node);
};


const mintNewNFT = async () =>{
  try{
    console.log(nftUrl)
    const img = await convertDOMtoBase64();
    const templateImage = dataURLtoFile(img, 'My_NFT.png');
    const ownerPublicKey = new PublicKey(provider.publicKey).toBase58();
    const selfCreator = new Creator({
      address: ownerPublicKey,
      verified: true,
      share: 100,
    });
    const metadata = {
      name: `SOLANA_NFT`,
      symbol: 'MNFT',
      creators: [selfCreator],
      description: 'Nft created for solana fellowship',
      sellerFeeBasisPoints: 0,
      image: templateImage.name,
      animation_url: '',
      external_url: '',
      properties: {
        files: [templateImage],
        category: 'image',
      },
    };
    console.log("Minting nft b64: ", img)
    const _nft = await mintNFT(
      connection,
      provider,
      {},
      [templateImage],
      metadata,
      nftUrl,
      1000000000,
    );
    console.log("Minted nft: ", _nft)
    setNftDetails(_nft)
  }catch(err){
    console.log(err)
  }
}


const burnNFT = async () =>{
  const account = new PublicKey(nftDetails.account); //account address where the NFT is being minted
    const owner = provider;
    const multiSigners = [];
    const amount = 1;
    const connectionParam = connection;
    const programId = programIds.tokenReceiverId; //second wallet in sol chain
    const publicKey = new PublicKey( nftDetails.mintKey); //nftMintKey you will receive while creating the NFT
    const payer = provider;
    const burnResult = await burn(
      account,
      owner,
      multiSigners,
      amount,
      connectionParam,
      programId,
      publicKey,
      payer
    );
    setNftBurnSignature(burnResult)
}


const connectToWallet = () =>{
  if(!provider && window.solana){
    setProvider(window.solana)
  }
  if(!provider){
    console.log("No provider found")
    return
  }
  if(provider && !provider.isConnected){
    provider.connect()
  }
}


  useEffect(() => {
    if (provider) {
        provider.on("connect", async() => {
          console.log("wallet got connected")
          setProviderPub(provider.publicKey)

        });
        provider.on("disconnect", () => {
          console.log("Disconnected from wallet");
        });
    }
  }, [provider]);

  useEffect(() => {
    if ("solana" in window && !provider) {
      console.log("Phantom wallet present")
      setProvider(window.solana)
    }
  },[])


  return (
    <div className="App">
      <header className="App-header">
          
           <button onClick={connectToWallet}> {providerPubKey ? 'Connected' : 'Connect'} to wallet {providerPubKey ? (providerPubKey).toBase58() : ""}</button>

           
           <img src={nftImage} style={{width:"200px"}} id="nftImage"></img>
          <button onClick={mintNewNFT}> {nftDetails && nftDetails.mintKey ? `NFT created, mintkey: ${nftDetails.mintKey}`:'Create NFT' } </button>
          <button onClick={burnNFT}> {nftBurnSignature ? `NFT burnt, signature: ${nftBurnSignature}`:'Burn NFT' } </button>
          <input type="text" value={nftUrl} onChange={(e)=> setNftUrl(e?.target?.value.trim())}/>
      </header>
    </div>
  );
}

export default App;