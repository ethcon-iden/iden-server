export function decodeCursor(cursor: string) {
  const decodedCursor = JSON.parse(
    Buffer.from(cursor, 'base64').toString('ascii'),
  ); // cursor should be in base64 format
  return decodedCursor;
}

export function encodeCursor(cursor: any) {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}
