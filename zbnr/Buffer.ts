type Callback<Data> = ( data: Data[], ready: () => void ) => void;
type Filter<Data> = ( data: Data ) => void | false;

interface Options<Data> {
  delay?: number,
  filter?: Filter<Data>
}

class Buffer<Data> {
  private _delay: number;
  private _filter?: Filter<Data>;
  private _callback: Callback<Data> = () => {};
  private _data: Data[] = [];
  private _interval?: NodeJS.Timeout;
  private _isStopped: boolean = false;
  private _isReady: boolean = true;

  constructor( {
    delay = 100,
    filter
  }: Options<Data> = {} ){
    this._delay = delay;
    this._filter = filter;
  }

  hook( callback: Callback<Data> ): void{
    this._callback = callback;
  }

  maybeClearInterval(): void{
    if( this._interval ){
      clearInterval( this._interval );
    }
  }

  debounce(): void{
    if( !this._isReady ) return;

    this.maybeClearInterval();

    this._interval = setInterval( () => {
      if( this._isReady && !this._isStopped && this._data.length > 0 ){
        this._isReady = false;
        this._callback( this._data, () => this.ready() );
        this._data = [];
        this.maybeClearInterval();
      }
    }, this._delay );
  }

  addData( data: Data ): void{
    if( this._isStopped ) return;

    if( !this._data.includes( data ) ){
      if( this._filter && this._filter( data ) === false ) return;

      this._data.push( data );
    }

    this.debounce();
  }

  stop(): void{
    this._isStopped = true;
  }

  start(): void{
    this._isStopped = false;
  }

  ready(): void{
    this._isReady = true;
  }
}

export type { Callback, Filter, Options };
export { Buffer };