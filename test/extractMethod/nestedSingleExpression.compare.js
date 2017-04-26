// input
() => {
  /* CS */5/* CE */ + 5;
}
// output
() => {
  const extracted = () => 5;
  extracted() + 5;
}
