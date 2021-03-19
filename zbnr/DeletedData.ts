class DeletedData<Data> {
  constructor(
    private _data: Data[]
  ){}

  *find( data: Data[] ){
    for( const data_ of this._data ){
      if( !data.includes( data_ ) ){
        yield data_;
      }
    }

    this._data = data;
  }
}

export { DeletedData };