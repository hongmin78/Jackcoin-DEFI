import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CoinData } from '../models';
import { ApiService } from './api.service';
import { ToasterService } from './toaster.service';

@Injectable({
  providedIn: 'root'
})
export class DataAggregatorService {
  constructor(private apiService: ApiService, private toasterService: ToasterService) { }
  // catch error
  private _formatErrors(error: any) {
    console.warn(error)
    // this.toasterService.msg.next({
    //   message: error.error,
    //   icon: 'alert-circle-outline',
    //   segmentClass: "toastError",
    // });
    return throwError((() => error))
  }

  protected _coinGecoAPI = 'https://api.coingecko.com/api/v3';
  public getCoinData(coinName: string, localization: boolean = false): Observable<CoinData> {
    return this.apiService.get(`${this._coinGecoAPI}/coins/${coinName}?localization=${localization}`).pipe(
      map((data) => {
        const { links, image, market_data, description,contract_address } = data;
        const coinInfo: CoinData = {
          name: coinName,
          desc: description.en,
          price: { btc: market_data.current_price.btc.toFixed(3), usd: market_data.current_price.usd.toFixed(2) },
          website: links.homepage[0],
          image,
          contract_address,
          price_change_percentage_24h_in_currency: { btc: market_data.price_change_percentage_24h_in_currency.btc.toFixed(1), usd: market_data.price_change_percentage_24h_in_currency.usd.toFixed(1) }
        }
        return coinInfo;
      }),
      catchError((error) => this._formatErrors(error))
    );
  }
  public async getCoinDataByContract(mintAddress: string, localization: boolean = false): Promise<CoinData> {
    try {

      const res: any = await fetch(`${this._coinGecoAPI}/coins/solana/contract/${mintAddress}?localization=${localization}`);
      const data = await res.json();
      const { links, image, market_data, symbol } = data;
      const coinData = {
        symbol,
        price: { btc: market_data.current_price.btc.toFixed(3), usd: market_data.current_price.usd.toFixed(2) },
        website: links.homepage[0],
        image,
        mintAddress,
        price_change_percentage_24h_in_currency: { btc: market_data.price_change_percentage_24h_in_currency.btc.toFixed(1), usd: market_data.price_change_percentage_24h_in_currency.usd.toFixed(1) }
      }
      return coinData

    } catch (error) {
      //console.error(error)
    }
  }
  public getCoinChartHistory(coinName: string, currency: string, days: any) {
    return this.apiService.get(`${this._coinGecoAPI}/coins/${coinName}/market_chart?vs_currency=${currency}&days=${days}`).pipe(
      map((data) => {
        const dateList = data.prices.map(item => new Date(item[0]).toLocaleString().split(',')[0]);
        const priceList = data.prices.map(item => item[1]);

        return [dateList, priceList];
      }),
      catchError((error) => this._formatErrors(error))
    );
  }

}
