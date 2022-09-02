import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import { firstValueFrom } from 'rxjs';
import { Nft } from 'src/app/models';
import { SolanaUtilsService, TxInterceptService, UtilsService } from 'src/app/services';
import { NftStoreService } from 'src/app/services/nft-store.service';

@Component({
  selector: 'app-nft-listing',
  templateUrl: './nft-listing.component.html',
  styleUrls: ['./nft-listing.component.scss']
})
export class NftListingComponent implements OnInit {
  @Input() walletOwner: PublicKey;
  @Input() tokenAccountPubkey: PublicKey;
  @Input() mintAddressPK: PublicKey;
  @Input() nft: Nft;
  public listNftForm: FormGroup = {} as FormGroup;
  public formSubmitted: boolean = false;
  public showDates: boolean = false;
  public expiryPlaceholder: string = 'no expiry';
  public minimumExpiry = new Date().toISOString()

  constructor(
    private _walletStore: WalletStore,
    private _nftStoreService: NftStoreService,
    private txInterceptService: TxInterceptService,
    private fb: FormBuilder
  ) {
    // console.log(walletOwner,auctionHouseAddress,associatedTokenAddress)
    this.listNftForm = this.fb.group({
      sellerAddress: [],
      tokenMint: [],
      tokenAccount: [],
      auctionHouseAddress: [],
      sol: ['', [Validators.required]],
      expiry: ['']
    })
  }


  async ngOnInit() {

    this.initFormSetup();
    this.listNftForm.controls.expiry.valueChanges.subscribe(val => {
      if (val == '') {
        this.expiryPlaceholder = 'no expiry';
      } else {
        this.expiryPlaceholder = val.split('T')[0];
      }
      this.showDates = false;
    })
  }

  private async initFormSetup() {
    console.log(this.walletOwner, this.tokenAccountPubkey, this.mintAddressPK)
    const auctionHouseAddress = 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe';

    this.listNftForm.controls.sellerAddress.setValue(this.walletOwner.toBase58())
    this.listNftForm.controls.tokenMint.setValue(this.mintAddressPK.toBase58())
    this.listNftForm.controls.tokenAccount.setValue(this.tokenAccountPubkey.toBase58())
    this.listNftForm.controls.auctionHouseAddress.setValue(auctionHouseAddress)

  }
  public async listNft(): Promise<void> {
    // get walletOwner
    const walletOwner = await (await firstValueFrom(this._walletStore.anchorWallet$)).publicKey;
    // assign form values
    const listInfo = this.listNftForm.value;
    // get transaction instructions buffer
    const txIns: { tx: any, txSigned: any } = await this._nftStoreService.nftListing(listInfo)
    // transform from buffer to transaction instructions object
    const txn = Transaction.from(Buffer.from(txIns.txSigned.data));
    txn.instructions[0].keys[0].isSigner= false
    // submit transaction using wallet adapter
    this.txInterceptService.sendTx([txn], walletOwner)
  }
  public async cancelNftListing(): Promise<void> {
    const listInfo = this.listNftForm.value;
    const txIns: { tx: any, txSigned: any } = await this._nftStoreService.cancelNftListing(listInfo)
    const walletOwner = await (await firstValueFrom(this._walletStore.anchorWallet$)).publicKey;
    const txn = Transaction.from(Buffer.from(txIns.txSigned.data))
    // const txn2 = Transaction.from(Buffer.from(txIns.tx))
    console.log(txn, txIns)
    this.txInterceptService.sendTx([txn], walletOwner)
  }
}
