import { Component, OnDestroy, OnInit } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { EpochInfo, LAMPORTS_PER_SOL, RpcResponseAndContext, Supply, VoteAccountStatus } from '@solana/web3.js';
import { forkJoin, map, Observable } from 'rxjs';
import { CoinData } from 'src/app/models';
import { ApiService, LoaderService, UtilsService } from 'src/app/services';
import { DataAggregatorService } from 'src/app/services/data-aggregator.service';
import { SolanaUtilsService } from 'src/app/services/solana-utils.service';

interface ClusterInfo {
  TPS: string,
  supply: { circulating: any, noneCirculating: any },
  stakeInfo: { activeStake: any, delinquentStake: any },
  solData: CoinData;
  epochInfo;
}
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  public clusterInfo: Observable<ClusterInfo> = forkJoin({
    solData: this._getSOLprice(),
    stakeInfo: this._solanaUtilsService.getStake(),
    supply: this._solanaUtilsService.getSupply(),
    TPS: this._solanaUtilsService.getTPS(),
    epochInfo: this._solanaUtilsService.getEpochInfo()
  }).pipe(map((data) => {
    data.TPS = Math.trunc(data?.TPS)
    return data
  }))

  constructor(
    private _dataAggregatorService: DataAggregatorService,
    private _solanaUtilsService: SolanaUtilsService,
    public loaderService: LoaderService,
  ) {
  }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {
  }

  private _getSOLprice(): Observable<any> {
    return this._dataAggregatorService.getCoinData('solana')
  }
}
