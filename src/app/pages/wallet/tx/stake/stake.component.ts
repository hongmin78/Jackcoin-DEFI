import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { map, observable, Observable, Subscriber, switchMap } from 'rxjs';
import { Asset } from 'src/app/models';
import { LoaderService, UtilsService } from 'src/app/services';
import { SolanaUtilsService } from 'src/app/services/solana-utils.service';
import { TxInterceptService } from 'src/app/services/txIntercept.service';
import { ValidatorData } from 'src/app/shared/models/validatorData.model';

@Component({
  selector: 'app-stake',
  templateUrl: './stake.component.html',
  styleUrls: ['./stake.component.scss'],
})
export class StakeComponent implements OnInit {
  @Input() wallet: Asset;
  public validatorsData: Observable<ValidatorData[] | any> = this.solanaUtilsService.currentValidatorData
  .pipe(map((validators) => {
    console.log(validators)
    const validatorsExtended = validators.map((validator:ValidatorData) => {
      return {
        name: validator.name,
        vote_identity: validator.vote_identity,
         image: validator.image,
         selectable:true,
          extraData: { 'APY estimate': validator.apy_estimate + '%', commission: validator.commission + '%'}}
    })
    return validatorsExtended
  }))
  @Input() avgApy: number;
  public showValidatorList: boolean = false;
  public stakeForm: FormGroup;
  public formSubmitted: boolean = false;
  public rewardInfo = {
    apy: 0,
    amount: 0
  }
  selectedValidator: ValidatorData;
  searchTerm = '';

  constructor(
    public loaderService:LoaderService,
    private fb:FormBuilder,
    private solanaUtilsService: SolanaUtilsService,
    private txInterceptService: TxInterceptService,
    private utils:UtilsService
    ) { }
  ngOnInit() {
    this.stakeForm = this.fb.group({
      amount: ['', [Validators.required]],
      voteAccount: ['', [Validators.required]],
    })
    this.stakeForm.valueChanges.subscribe(form =>{
      this.rewardInfo.amount = form.amount
    })

  }
  setMaxAmount() {
    const fixedAmount = this.utils.shortenNum(this.wallet.balance - 0.0001)
    this.stakeForm.controls.amount.setValue(fixedAmount);
  }

  setSelectedValidator(validator:ValidatorData) {
    this.rewardInfo.apy = validator.apy_estimate;
    
    this.selectedValidator = validator;
    this.showValidatorList = !this.showValidatorList

    this.stakeForm.controls.voteAccount.setValue(validator.vote_identity);
  }
  submitNewStake(){
    const {amount, voteAccount} = this.stakeForm.value;
    const walletOwnerPublicKey =  this.wallet.publicKey;
    
    this.txInterceptService.delegate(amount * LAMPORTS_PER_SOL,walletOwnerPublicKey,voteAccount)
  }
}