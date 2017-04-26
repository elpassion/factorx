// input
() => {
  /* CS */5 + 5;
  5 + 5;/* CE */
}
// output
() => {
  const extracted = () => {
    5 + 5;
    5 + 5;
  };

  extracted();
}
