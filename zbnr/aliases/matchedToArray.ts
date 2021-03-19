function matchedToArray( txt: string, ...regexps: RegExp[] ){
  const values = [];

  for( const regexp of regexps ){
    const matched = txt.matchAll( regexp );

    while( true ){
      const { value, done } = matched.next();

      if( done ){
        break;
      }

      values.push( value );
    }
  }

  return values;
}

export { matchedToArray };