import { Injectable } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { SolanaUtilsService } from './solana-utils.service';

import { Nft, NFTGroup } from '../models';
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { PublicKey } from '@solana/web3.js';
import { firstValueFrom, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

interface ListInstuction {
  sellerAddress: string,
  auctionHouseAddress: string,
  tokenMint: string,
  tokenAccount: string,
  sol: string,
  expiry: string
}
@Injectable({
  providedIn: 'root'
})
export class NftStoreService {
  protected magicEdenApiProxy = environment.magicEdenProxyAPI;
  protected metaplexApiProxy = environment.metaplexProxyAPI;
  private _metaplex = new Metaplex(this._solanaUtilsService.connection);
  private myNfts: Subject<Nft[]> = new Subject();
  public myNft$ = this.myNfts.asObservable();
  constructor(
    private _walletStore: WalletStore,
    private _solanaUtilsService: SolanaUtilsService,
  ) {

  }
  public async createNft() {
    const wallet = await (await firstValueFrom(this._walletStore.anchorWallet$));
    this._metaplex.use(walletAdapterIdentity(wallet));
    const { nft } = await this._metaplex
      .nfts()
      .create({
        uri: "https://yyuf64d3dxl7pzwpyvwb24vqgztrxci5w3rvubbogt5s2d2m3weq.arweave.net/xihfcHsd1_fmz8VsHXKwNmcbiR2241oELjT7LQ9M3Yk",
        name: "my nft 2",
        sellerFeeBasisPoints: 500, // Represents 5.00%.
      })
      .run();
  }
  public async getMagicEdenOwnerNFTS(walletOwnerAddress: string): Promise<any[]> {
    const uri = `${this.magicEdenApiProxy}&endpoint=wallets/${walletOwnerAddress}/tokens`
    const getNFTsReq = await fetch(uri)
    const nfts: Nft[] = await getNFTsReq.json();
    return nfts
  }


  public async nftListing({ sellerAddress, auctionHouseAddress, tokenMint, tokenAccount, sol, expiry }: ListInstuction) {

    const queryParam = encodeURIComponent(`price=${sol}&seller=${sellerAddress}&auctionHouseAddress=${auctionHouseAddress}&tokenMint=${tokenMint}&tokenAccount=${tokenAccount}&expiry=${expiry}`)
    const uri = `${this.magicEdenApiProxy}&endpoint=instructions/sell&queryParam=${queryParam}`;
    const getSellNftInstructionReq = await fetch(uri)
    const sellNftInstructionReq = await getSellNftInstructionReq.json();
    return sellNftInstructionReq
  }
  public async nftListingCancel({ sellerAddress, auctionHouseAddress, tokenMint, tokenAccount, sol, expiry }: ListInstuction) {

    const queryParam = encodeURIComponent(`price=${sol}&seller=${sellerAddress}&auctionHouseAddress=${auctionHouseAddress}&tokenMint=${tokenMint}&tokenAccount=${tokenAccount}&expiry=${expiry}`)
    const uri = `${this.magicEdenApiProxy}&endpoint=instructions/sell_cancel&queryParam=${queryParam}`;
    const getSellNftInstructionReq = await fetch(uri)
    const sellNftInstructionReq = await getSellNftInstructionReq.json();
    return sellNftInstructionReq
  }

  public async listStatus(mintAddress: string): Promise<any> {
    const uri = `${this.magicEdenApiProxy}&endpoint=tokens/${mintAddress}/listings`
    const getListreq = await fetch(uri)
    const listStatus: any = await getListreq.json();

    return listStatus
  }
  public async getSingleNft(wallet, mintAddressPK: PublicKey): Promise<Nft> {
    this._metaplex.use(walletAdapterIdentity(wallet));
    const metaplexItem = await this._metaplex.nfts().findByMint({ mintAddress: mintAddressPK }).run();
    const metaData = await this.getMetaData(metaplexItem.uri);
    const nft: Nft = this._nftDataPrep(metaData, metaplexItem)
    return nft
  }
  public async getAllOnwerNfts(walletOwnerAddress): Promise<Nft[]> {
    // debugger
    const uri = `${this.metaplexApiProxy}?env=${environment.solanaEnv}&walletAdress=${walletOwnerAddress}`
    const getNFTsReq = await fetch(uri)
    const nfts: Nft[] = await getNFTsReq.json();

    const magicEdenNfts: Nft[] = await this.getMagicEdenOwnerNFTS(walletOwnerAddress);

    const extendNFTdata = magicEdenNfts.map(nft => {
      const extendNFT = nfts.find(mpNFT => mpNFT.mintAddress == nft.mintAddress);
      if(!extendNFT){
        nfts.push(nft)
      }
      const extendedNFT = {...magicEdenNfts, ...nft};
      return extendedNFT
    });
    console.log(extendNFTdata)
    this.myNfts.next(nfts);
    return nfts
    // const wallet =  await (await firstValueFrom(this._walletStore.anchorWallet$));
    // this._metaplex.use(walletAdapterIdentity(wallet));
    // const myNfts = await this._metaplex
    // .nfts()
    // .findAllByOwner({ owner: new PublicKey(walletOwnerAddress) })
    // .run();

    // const myNftsExtended: Nft[] = await Promise.all(myNfts.map(async (metaplexItem) => {
    //   try {
    //     const metaData = await this.getMetaData(metaplexItem.uri);
    //     const nft: Nft = this._nftDataPrep(metaData,metaplexItem);
    //     return nft
    //   } catch (error) {
    //     console.warn(error)
    //   }
    // }))
    // return myNftsExtended;


  }

  private _nftDataPrep(metaData, metaplexItem): Nft {
    try {
      const nft: Nft = {
        image: metaData.image,
        description: metaData.description,
        attributes: metaData.attributes,
        websiteURL: metaData.external_url,
        name: metaplexItem.name,
        mintAddress: metaplexItem?.mintAddress || metaplexItem.mint.address,
        collectionName: metaplexItem.collection?.name,
        explorerURL: 'https://solscan.io/token/' + metaplexItem.address,
        symbol: metaplexItem.symbol
      }
      return nft
    } catch (error) {
      console.warn(error)
    }
  }
  private async getMetaData(uri: string): Promise<any> {
    let metaData: any = {}
    try {
      metaData = await (await fetch(uri)).json();
      // metaDataRes = await metaDataReq.json();
    } catch (error) {
      // console.error(error)
      return metaData
    }
    return metaData
  }
  public async getCollectionData(groupIdentifierMintAddress: string): Promise<NFTGroup> {
    let collectionInfo: NFTGroup = { collectionImage: null, description: null, collectionName: null, symbol: null, mint: null, floorPrice: 0 }
    const mintAddress = new PublicKey(groupIdentifierMintAddress);
    // check if the NFT is part of a collection
    const validateNftCollectionTask = this._metaplex.nfts().findByMint({ mintAddress });

    const { collection, json } = await validateNftCollectionTask.run();
    collectionInfo.description = json.description;
    if (collection) {
      const collectionDataTask = this._metaplex.nfts().findByMint({ mintAddress: collection.address });
      const { mint, json } = await collectionDataTask.run();
      collectionInfo = { collectionImage: json.image, collectionName: json.name, description: collectionInfo.description, symbol: json.symbol, mint: mint.address.toBase58() }
    }
    return collectionInfo
  }
  public async getCollectionMarketplaceData(symbol: string) {
    const queryParam = encodeURIComponent('limit=1')
    const uri = `${this.magicEdenApiProxy}&endpoint=/collections/${symbol}/listings&queryParam=${queryParam}`;
    const getCollectionMarketplace = await fetch(uri)
    const marketplacedata: any = await getCollectionMarketplace.json();
    return marketplacedata[0]
  }
  private getFloorPrice(nft: Nft): number {
    return 0
  }
}
